"""Feature extraction.

This is the single source of truth for *what* the ranker sees. Both the
heuristic scorer and the learned ranker consume the same `FeatureBundle`, which
means an upgraded model can never silently change the explanation the UI shows —
only the final number.

Feature vector layout matches `config.FEATURE_NAMES` exactly.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Iterable

from . import config
from .locations import location
from .skills import skill_name
from .schemas import JobIn, JobSkillIn, ProfileIn

EARTH_RADIUS_KM = 6371.0


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km, rounded to one decimal like the TS engine."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a)), 1)


def _field(obj: Any, name: str, default: Any = None) -> Any:
    """Read a field from either a mapping or a pydantic model.

    This matters more than it looks: when the service is invoked over HTTP,
    FastAPI has already validated the body into `ProfileIn`/`JobIn`, so nested
    items arrive as *models*, not dicts. Direct/in-process callers still pass
    plain dicts. Every accessor below must tolerate both.
    """
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(name, default)
    return getattr(obj, name, default)


def _coerce_user_skills(profile: ProfileIn) -> dict[str, dict[str, Any]]:
    """Normalise the three shapes the proxy may send for profile skills."""
    skills: dict[str, dict[str, Any]] = {}

    def add(raw: Any, *, overwrite: bool) -> None:
        skill_id = _field(raw, "skillId") or (raw if isinstance(raw, str) else None)
        if not skill_id:
            return
        entry = {
            "proficiency": str(_field(raw, "proficiency") or "INTERMEDIATE"),
            "yearsExperience": float(_field(raw, "yearsExperience") or 0.0),
        }
        if overwrite:
            skills[str(skill_id)] = entry
        else:
            skills.setdefault(str(skill_id), entry)

    # `skills` is the canonical source; the two proxy-added fields are fallbacks.
    for raw in profile.skills or []:
        add(raw, overwrite=True)
    for raw in profile.skillIdsWithLevels or []:
        add(raw, overwrite=False)
    for raw in profile.skillIds or []:
        add(raw, overwrite=False)

    return skills


def _coerce_job_requirements(job: JobIn) -> list[JobSkillIn]:
    """The route may send `skills` (objects) or `skillIds` (objects or strings)."""

    def convert(raw: Any) -> JobSkillIn | None:
        skill_id = _field(raw, "skillId") or (raw if isinstance(raw, str) else None)
        if not skill_id:
            return None
        return JobSkillIn(
            skillId=str(skill_id),
            importance=str(_field(raw, "importance") or "PREFERRED"),
            minProficiency=str(_field(raw, "minProficiency") or "BEGINNER"),
        )

    requirements = [r for r in (convert(raw) for raw in job.skills or []) if r is not None]
    if not requirements:
        requirements = [r for r in (convert(raw) for raw in job.skillIds or []) if r is not None]
    return requirements


def _skill_names(ids: Iterable[str]) -> list[str]:
    return [skill_name(i) for i in ids]


def _tokens(text: str) -> list[str]:
    cleaned = "".join(ch.lower() if ch.isalnum() else " " for ch in text)
    return [t for t in cleaned.split() if len(t) > 2]


def profile_document(profile: ProfileIn) -> str:
    """Free-text view of the candidate, mirroring `profileDocument()` in TS."""
    known = _coerce_user_skills(profile)
    parts = [
        profile.careerGoal or "",
        profile.bio or "",
        profile.course or "",
        profile.resumeText or "",
        " ".join(profile.industries or []),
        " ".join(_skill_names(known.keys())),
    ]
    return " ".join(p for p in parts if p)


def job_document(job: JobIn) -> str:
    """Free-text view of the role, mirroring `jobDocument()` in TS."""
    parts = [
        job.title,
        job.company,
        job.sector,
        job.description,
        " ".join(job.requirements or []),
        " ".join(job.responsibilities or []),
        " ".join(_skill_names(r.skillId for r in _coerce_job_requirements(job))),
    ]
    return " ".join(p for p in parts if p)


def lexical_similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity over sublinear term frequencies.

    Dependency-free fallback for the semantic factor. Unlike a corpus TF-IDF it
    needs no background documents, so a single `/predict` call is enough. When a
    corpus *is* supplied the caller may pass `idf` to sharpen the weighting.
    """
    tok_a, tok_b = _tokens(text_a), _tokens(text_b)
    if not tok_a or not tok_b:
        return 0.0

    def counts(tokens: list[str]) -> dict[str, float]:
        raw: dict[str, float] = {}
        for t in tokens:
            raw[t] = raw.get(t, 0.0) + 1.0
        return {t: 1.0 + math.log(c) for t, c in raw.items()}

    ca, cb = counts(tok_a), counts(tok_b)
    shared = set(ca) & set(cb)
    if not shared:
        return 0.0

    dot = sum(ca[t] * cb[t] for t in shared)
    norm_a = math.sqrt(sum(v * v for v in ca.values()))
    norm_b = math.sqrt(sum(v * v for v in cb.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return round(min(1.0, dot / (norm_a * norm_b)), 4)


# --------------------------------------------------------------------------- #
# the bundle
# --------------------------------------------------------------------------- #
@dataclass
class SkillBreakdown:
    matched: list[str] = field(default_factory=list)
    partial: list[str] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    required_missing: list[str] = field(default_factory=list)
    score: float = 0.5
    coverage: float = 0.0
    required_coverage: float = 0.0


@dataclass
class FeatureBundle:
    """Everything a model needs, plus the human-readable reasons behind it."""

    vector: list[float]
    features: dict[str, float]
    skills: SkillBreakdown
    education_score: float
    education_detail: str
    experience_score: float
    experience_detail: str
    location_score: float
    location_detail: str
    preference_score: float
    preference_detail: str
    semantic_score: float
    distance_km: float | None
    explanations: list[str]
    warnings: list[str]
    factor_scores: dict[str, float]
    factor_details: dict[str, str]


# --------------------------------------------------------------------------- #
# individual factor scorers (mirrored 1:1 with src/lib/ai/match-engine.ts)
# --------------------------------------------------------------------------- #
def _skill_scoring(profile: ProfileIn, job: JobIn) -> SkillBreakdown:
    known = _coerce_user_skills(profile)
    requirements = _coerce_job_requirements(job)
    breakdown = SkillBreakdown()

    if not requirements:
        # No listed requirements: treat as neutral rather than perfect, so a thin
        # job posting cannot out-rank a well-specified one.
        breakdown.score = 0.5
        return breakdown

    earned = 0.0
    possible = 0.0
    required_earned = 0.0
    required_possible = 0.0

    for req in requirements:
        weight = config.IMPORTANCE_WEIGHT.get(req.importance, 0.5)
        possible += weight
        is_required = req.importance == "REQUIRED"
        if is_required:
            required_possible += 1.0

        known_skill = known.get(req.skillId)
        if not known_skill:
            breakdown.missing.append(req.skillId)
            if is_required:
                breakdown.required_missing.append(req.skillId)
            continue

        have = config.PROFICIENCY_ORDER.get(str(known_skill["proficiency"]), 1)
        needs = config.PROFICIENCY_ORDER.get(req.minProficiency, 1)

        if have >= needs:
            earned += weight
            if is_required:
                required_earned += 1.0
            breakdown.matched.append(req.skillId)
        else:
            # Partial credit: the skill exists but below the expected level.
            earned += weight * 0.6
            if is_required:
                required_earned += 0.6
            breakdown.partial.append(req.skillId)

    breakdown.score = earned / possible if possible else 0.5
    breakdown.coverage = len(breakdown.matched) / len(requirements)
    breakdown.required_coverage = (
        required_earned / required_possible if required_possible else 1.0
    )
    return breakdown


def _education_scoring(profile: ProfileIn, job: JobIn) -> tuple[float, str]:
    if not profile.education:
        return 0.6, "Education not added to your profile yet."
    have = config.EDUCATION_ORDER.get(profile.education, 0)
    needs = config.EDUCATION_ORDER.get(job.educationRequired, 0)
    if have >= needs:
        return 1.0, "Your education meets or exceeds the requirement."
    gap = needs - have
    if gap == 1:
        return 0.6, "Your qualification is one step below the stated requirement."
    return 0.3, "Your qualification is below the stated requirement."


def _experience_scoring(profile: ProfileIn, job: JobIn) -> tuple[float, str]:
    if not profile.experience:
        return 0.6, "Experience not added to your profile yet."
    have = config.EXPERIENCE_ORDER.get(profile.experience, 0)
    needs = config.EXPERIENCE_ORDER.get(job.experienceRequired, 0)
    if have >= needs:
        return 1.0, "Your experience level matches this role."
    gap = needs - have
    if gap == 1:
        return 0.65, "This role expects slightly more experience than you have."
    return 0.35, "This role expects considerably more experience than you have."


def _location_scoring(profile: ProfileIn, job: JobIn) -> tuple[float, float | None, str]:
    home = location(profile.locationId)
    work = location(job.locationId)

    if job.workMode == "REMOTE":
        return 0.95, None, "Remote role — you can work from your village."

    km = haversine_km(
        float(home["lat"]),  # type: ignore[arg-type]
        float(home["lng"]),  # type: ignore[arg-type]
        float(work["lat"]),  # type: ignore[arg-type]
        float(work["lng"]),  # type: ignore[arg-type]
    )

    if job.locationId in (profile.preferredLocationIds or []):
        return 1.0, km, "This location is one of your preferred work locations."

    if km <= 25:
        score = 1.0
    elif km <= 60:
        score = 0.85
    elif km <= 120:
        score = 0.65
    elif km <= 250:
        score = 0.4
    else:
        score = 0.2
    if job.workMode == "HYBRID":
        score = min(1.0, score + 0.05)

    detail = (
        f"Only about {km:g} km from your location — a manageable daily commute."
        if km <= 60
        else f"About {km:g} km from your location; relocation or hybrid arrangement needed."
    )
    return score, km, detail


def _preference_scoring(profile: ProfileIn, job: JobIn) -> tuple[float, str]:
    checks: list[tuple[bool, str]] = []

    if profile.jobTypes:
        checks.append((job.jobType in profile.jobTypes, f"job type ({_human(job.jobType)})"))
    if profile.workModes:
        checks.append((job.workMode in profile.workModes, f"work mode ({_human(job.workMode)})"))
    if profile.industries:
        checks.append((job.sector in profile.industries, f"industry ({job.sector})"))
    offered = job.salaryMax or job.salaryMin
    if profile.salaryExpectation and offered:
        checks.append(
            (
                float(offered) >= float(profile.salaryExpectation),
                f"salary expectation (₹{int(profile.salaryExpectation):,})",
            )
        )

    if not checks:
        return 0.7, "Add job preferences to sharpen your matches."

    hits = [c for c in checks if c[0]]
    score = len(hits) / len(checks)
    if len(hits) == len(checks):
        return score, "This role matches all of your stated preferences."
    missed = ", ".join(label for hit, label in checks if not hit)
    return score, f"Matches {len(hits)} of {len(checks)} preferences — check {missed}."


def _human(value: str) -> str:
    return value.lower().replace("_", " ")


def _salary_fit(profile: ProfileIn, job: JobIn) -> float:
    offered = job.salaryMax or job.salaryMin
    expected = profile.salaryExpectation
    if not offered or not expected:
        return 0.5
    ratio = float(offered) / max(float(expected), 1.0)
    return max(0.0, min(1.0, ratio))


# --------------------------------------------------------------------------- #
# public entry point
# --------------------------------------------------------------------------- #
def extract(
    profile: ProfileIn,
    job: JobIn,
    *,
    semantic_similarity: float | None = None,
) -> FeatureBundle:
    """Build the feature bundle for a single (profile, job) pair.

    `semantic_similarity` is injected by the caller so the embeddings backend can
    be swapped (or batched) without touching the rest of the pipeline.
    """
    skills = _skill_scoring(profile, job)
    education_score, education_detail = _education_scoring(profile, job)
    experience_score, experience_detail = _experience_scoring(profile, job)
    location_score, distance_km, location_detail = _location_scoring(profile, job)
    preference_score, preference_detail = _preference_scoring(profile, job)
    requirements = _coerce_job_requirements(job)

    semantic = (
        float(semantic_similarity)
        if semantic_similarity is not None
        else lexical_similarity(profile_document(profile), job_document(job))
    )

    required_count = sum(1 for r in requirements if r.importance == "REQUIRED")
    required_missing_ratio = (
        len(skills.required_missing) / required_count if required_count else 0.0
    )
    partial_ratio = len(skills.partial) / len(requirements) if requirements else 0.0
    distance_norm = (
        0.0
        if distance_km is None
        else min(1.0, max(0.0, float(distance_km) / config.DECAY_KM))
    )

    features: dict[str, float] = {
        "skill_match_ratio": round(skills.score, 4),
        "required_missing_ratio": round(required_missing_ratio, 4),
        "partial_skill_ratio": round(partial_ratio, 4),
        "matched_skill_coverage": round(skills.coverage, 4),
        "education_score": round(education_score, 4),
        "experience_score": round(experience_score, 4),
        "location_score": round(location_score, 4),
        "distance_norm": round(distance_norm, 4),
        "is_remote": 1.0 if job.workMode == "REMOTE" else 0.0,
        "preference_score": round(preference_score, 4),
        "salary_fit": round(_salary_fit(profile, job), 4),
        "semantic_similarity": round(semantic, 4),
        "rural_friendly": 1.0 if job.isRuralFriendly else 0.0,
        "local_language": 1.0 if job.localLanguageSupport else 0.0,
    }

    factor_scores = {
        "skills": skills.score,
        "location": location_score,
        "education": education_score,
        "experience": experience_score,
        "preferences": preference_score,
        "semantic": semantic,
    }
    factor_details = {
        "skills": (
            f"You already have {len(skills.matched)} of {len(requirements)} listed skills."
            if requirements
            else "This posting lists no specific skill requirements."
        ),
        "location": location_detail,
        "education": education_detail,
        "experience": experience_detail,
        "preferences": preference_detail,
        "semantic": "How closely the job description reads like your career goal and experience.",
    }

    return FeatureBundle(
        vector=[features[name] for name in config.FEATURE_NAMES],
        features=features,
        skills=skills,
        education_score=education_score,
        education_detail=education_detail,
        experience_score=experience_score,
        experience_detail=experience_detail,
        location_score=location_score,
        location_detail=location_detail,
        preference_score=preference_score,
        preference_detail=preference_detail,
        semantic_score=semantic,
        distance_km=distance_km,
        explanations=[],
        warnings=[],
        factor_scores=factor_scores,
        factor_details=factor_details,
    )


def build_explanations(profile: ProfileIn, job: JobIn, bundle: FeatureBundle) -> list[str]:
    """Human-readable reasons, phrased the way the UI renders them."""
    skills = bundle.skills
    matched_names = _skill_names(skills.matched + skills.partial)
    missing_names = _skill_names(skills.missing)

    reasons: list[str] = []
    if matched_names:
        reasons.append(f"Your {', '.join(matched_names[:4])} skills are used in this role.")
    reasons.append(bundle.location_detail)
    if "meets" in bundle.education_detail:
        reasons.append(bundle.education_detail)
    if "matches" in bundle.experience_detail:
        reasons.append(bundle.experience_detail)
    if job.isRuralFriendly:
        reasons.append("This employer explicitly hires candidates from rural areas.")
    if job.localLanguageSupport:
        reasons.append("The workplace supports local-language communication.")

    if missing_names:
        reasons.append(
            f"Missing skill{'s' if len(missing_names) > 1 else ''}: {', '.join(missing_names)}"
        )
    if skills.required_missing:
        reasons.append(
            f"{len(skills.required_missing)} of these are mandatory for the role, "
            "so training will noticeably improve your chances."
        )
    return reasons
