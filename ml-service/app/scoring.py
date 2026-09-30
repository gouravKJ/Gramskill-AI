"""Scoring service — the seam between FastAPI and the models.

Responsibilities kept here (and deliberately *not* in the route handlers):

  * compute the semantic factor once per request via the embeddings backend;
  * run the registry-selected matcher;
  * project the probability onto the shared 5–99 UI scale;
  * assemble the explanation, factor decomposition and warnings.
"""

from __future__ import annotations

import time

from . import config
from .features import build_explanations, extract, job_document, profile_document
from .models import confidence_for, matcher
from .models.embeddings import backend_name, pair_similarity
from .schemas import FactorOut, JobIn, MatchPrediction, ProfileIn
from .skills import skill_name


def to_ui_scale(probability: float) -> int:
    """Map a 0..1 probability onto the 5..99 scale the TypeScript engine emits.

    The floor of 5 keeps a genuinely poor match from reading as "0%", which in
    user testing made rural users think the app was broken.
    """
    scaled = probability * 100.0
    return int(max(config.SCORE_MIN, min(config.SCORE_MAX, round(scaled))))


def _warnings(profile: ProfileIn, bundle) -> list[str]:
    out: list[str] = []
    if not profile.skills and not profile.skillIds and not profile.skillIdsWithLevels:
        out.append("Profile lists no skills, so the skill factor is neutral.")
    if not profile.education:
        out.append("Education is missing from the profile.")
    if not profile.experience:
        out.append("Experience level is missing from the profile.")
    if not (profile.careerGoal or profile.bio or profile.resumeText):
        out.append("No career goal or resume text supplied — semantic similarity is weak.")
    if bundle.skills.required_missing:
        out.append(
            "Missing mandatory skills: "
            + ", ".join(skill_name(s) for s in bundle.skills.required_missing)
        )
    return out


def predict(
    profile: ProfileIn,
    job: JobIn,
    *,
    profile_text: str | None = None,
    semantic: float | None = None,
) -> MatchPrediction:
    """Score one (profile, job) pair and explain the result."""
    started = time.perf_counter()

    if semantic is None:
        text = profile_text if profile_text is not None else profile_document(profile)
        semantic = pair_similarity(text, job_document(job))

    bundle = extract(profile, job, semantic_similarity=semantic)
    model = matcher()
    probability = model.score(bundle)
    score = to_ui_scale(probability)

    # The linear reconstruction of the same factors. Equal to `probability` when
    # the heuristic matcher is active; slightly different (and usually more
    # accurate) when a learned ranker is serving the request.
    baseline_probability = sum(
        bundle.factor_scores[key] * weight for key, weight in config.FACTOR_WEIGHTS.items()
    )

    factors = [
        FactorOut(
            key=key,
            label=config.FACTOR_LABELS[key],
            score=round(bundle.factor_scores[key], 4),
            weight=weight,
            contribution=round(bundle.factor_scores[key] * weight, 4),
            detail=bundle.factor_details[key],
        )
        for key, weight in config.FACTOR_WEIGHTS.items()
    ]

    return MatchPrediction(
        engine=config.SERVICE_NAME,
        modelVersion=config.MODEL_VERSION,
        modelKind=model.kind,
        semanticBackend=backend_name(),
        matchScore=score,
        probability=round(probability, 4),
        baselineProbability=round(baseline_probability, 4),
        confidence=confidence_for(bundle, probability),
        factors=factors,
        matchedSkills=[skill_name(s) for s in bundle.skills.matched],
        partialSkills=[skill_name(s) for s in bundle.skills.partial],
        missingSkills=[skill_name(s) for s in bundle.skills.missing],
        requiredMissing=[skill_name(s) for s in bundle.skills.required_missing],
        matchedSkillIds=list(bundle.skills.matched),
        missingSkillIds=list(bundle.skills.missing),
        requiredSkillCoverage=round(bundle.skills.required_coverage, 4),
        distanceKm=bundle.distance_km,
        explanations=build_explanations(profile, job, bundle),
        warnings=_warnings(profile, bundle),
        latencyMs=round((time.perf_counter() - started) * 1000, 2),
    )


def predict_batch(
    profile: ProfileIn,
    jobs: list[JobIn],
    *,
    top_k: int | None = None,
) -> list[MatchPrediction]:
    """Score many jobs, reusing the profile document across the batch."""
    profile_text = profile_document(profile)
    results = [predict(profile, job, profile_text=profile_text) for job in jobs]
    # Tie-break on fewer missing skills, then on the model's raw probability, so
    # two jobs rounding to the same integer score are still ordered meaningfully.
    results.sort(
        key=lambda r: (-r.matchScore, len(r.missingSkills), -r.probability, r.modelVersion)
    )
    if top_k is not None and top_k > 0:
        return results[:top_k]
    return results
