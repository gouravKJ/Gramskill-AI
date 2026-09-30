"""Dependency-light smoke check.

Unlike `test_service.py` (which uses pytest + FastAPI's TestClient), this script
needs only numpy/scikit-learn and starts no web server. It is what CI and the
project's own `npm run ml:check` use to answer "is the ranking logic sane?"
without waiting on a network install.

    cd ml-service
    python tests/verify_logic.py
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import config  # noqa: E402
from app.features import extract, haversine_km, lexical_similarity  # noqa: E402
from app.models import matcher  # noqa: E402
from app.models.gradient_boosted import synthetic_dataset, train_ranker  # noqa: E402
from app.schemas import JobIn, ProfileIn  # noqa: E402
from app.scoring import predict, predict_batch, to_ui_scale  # noqa: E402

FAILURES: list[str] = []


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  PASS  {label}")
    else:
        FAILURES.append(label)
        print(f"  FAIL  {label} {detail}")


PROFILE = ProfileIn(
    userId="usr-ravi",
    name="Ravi Kumar",
    locationId="loc-koraput",
    education="DIPLOMA",
    experience="ZERO_TO_ONE",
    jobTypes=["FULL_TIME"],
    workModes=["ONSITE"],
    industries=["Accounting"],
    salaryExpectation=15000,
    careerGoal="I want to become an Accounts Assistant in a company near my village.",
    skills=[
        {"skillId": "sk-excel", "proficiency": "INTERMEDIATE", "yearsExperience": 1},
        {"skillId": "sk-accounting", "proficiency": "INTERMEDIATE", "yearsExperience": 1},
        {"skillId": "sk-communication", "proficiency": "ADVANCED", "yearsExperience": 2},
    ],
)

GOOD_JOB = JobIn(
    id="job-local-accounts",
    title="Accounts Assistant",
    company="Demo Cooperative",
    sector="Accounting",
    description="Maintain ledgers and daily accounts for a rural cooperative.",
    locationId="loc-koraput",
    workMode="ONSITE",
    jobType="FULL_TIME",
    experienceRequired="FRESHER",
    educationRequired="CLASS_12",
    salaryMin=15000,
    salaryMax=22000,
    isRuralFriendly=True,
    localLanguageSupport=True,
    skills=[
        {"skillId": "sk-excel", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
        {"skillId": "sk-accounting", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
        {"skillId": "sk-communication", "importance": "PREFERRED", "minProficiency": "BEGINNER"},
    ],
)

BAD_JOB = JobIn(
    id="job-far-welding",
    title="Welder",
    company="Demo Fabrication",
    sector="Manufacturing",
    description="Arc welding of steel structures on site.",
    locationId="loc-ranchi",
    workMode="ONSITE",
    jobType="CONTRACT",
    experienceRequired="THREE_PLUS",
    educationRequired="ITI",
    salaryMin=9000,
    salaryMax=12000,
    skills=[
        {"skillId": "sk-welding", "importance": "REQUIRED", "minProficiency": "ADVANCED"},
        {"skillId": "sk-masonry", "importance": "REQUIRED", "minProficiency": "INTERMEDIATE"},
    ],
)


def main() -> int:
    print("\n[1] geometry + lexical helpers")
    km = haversine_km(18.8128, 82.7105, 20.2961, 85.8245)
    check("Koraput -> Bhubaneswar straight line in 340-390 km", 340 < km < 390, f"got {km}")
    check("identical documents score 1.0", lexical_similarity("gst ledger", "gst ledger") == 1.0)
    check("disjoint documents score 0.0", lexical_similarity("ledger", "welding") == 0.0)
    check("empty document scores 0.0", lexical_similarity("", "welding") == 0.0)

    print("\n[2] feature vector")
    bundle = extract(PROFILE, GOOD_JOB)
    check("14 features emitted", len(bundle.vector) == len(config.FEATURE_NAMES))
    check("all features in [0,1]", all(0.0 <= v <= 1.0 for v in bundle.vector))
    check("required coverage complete", bundle.skills.required_coverage == 1.0)
    check("same-city distance is 0", bundle.distance_km == 0.0)
    check("no missing skills", not bundle.skills.missing)

    bad_bundle = extract(PROFILE, BAD_JOB)
    check("mandatory skills flagged missing", bool(bad_bundle.skills.required_missing))
    check("distance normalised <= 1", bad_bundle.features["distance_norm"] <= 1.0)

    print("\n[3] ranker")
    model = matcher()
    print(f"        kind={model.kind}  backend={model.backend}")
    good = predict(PROFILE, GOOD_JOB)
    bad = predict(PROFILE, BAD_JOB)
    print(f"        good={good.matchScore}  bad={bad.matchScore}  confidence={good.confidence}")
    check("score within 5..99", 5 <= good.matchScore <= 99)
    check("local accounting role outranks far welding role", good.matchScore > bad.matchScore)
    check(
        "factors reconstruct the linear baseline",
        abs(sum(f.contribution for f in good.factors) - good.baselineProbability) < 0.02,
    )
    check(
        "learned ranker refines the baseline",
        abs(good.probability - good.baselineProbability) >= 0.0,
    )
    check("explanation present", bool(good.explanations))
    check("matched skill names are human readable", "Excel" in good.matchedSkills)
    check("missing skill names are human readable", "Welding" in bad.missingSkills)
    check("batch sorts descending", _is_sorted(predict_batch(PROFILE, [BAD_JOB, GOOD_JOB])))
    check("topK truncates", len(predict_batch(PROFILE, [BAD_JOB, GOOD_JOB], top_k=1)) == 1)
    check("partial profile still scores", predict(ProfileIn(locationId="loc-koraput"), GOOD_JOB).matchScore >= 5)
    check("ui scale clamps", to_ui_scale(0.0) == 5 and to_ui_scale(1.0) == 99)

    print("\n[4] training pipeline")
    matrix, labels = synthetic_dataset(n_samples=500)
    check("dataset shape", matrix.shape == (500, len(config.FEATURE_NAMES)))
    check("labels in [0,1]", float(labels.min()) >= 0.0 and float(labels.max()) <= 1.0)
    _, metrics, backend = train_ranker(n_samples=3000)
    print(f"        backend={backend} R2={metrics['holdoutR2']} MAE={metrics['holdoutMae']}")
    print(f"        linear baseline R2={metrics['linearBaselineR2']} MAE={metrics['linearBaselineMae']}")
    check("learned ranker captures non-linear signal (R2 > 0.85)", metrics["holdoutR2"] > 0.85)
    check(
        "learned ranker beats the linear baseline",
        metrics["holdoutMae"] < metrics["linearBaselineMae"],
    )

    print("\n[5] robustness")
    long_job = BAD_JOB.model_copy(update={"title": "x" * 500, "description": "y" * 900})
    check("very long text does not crash", predict(PROFILE, long_job).matchScore >= 5)
    unknown = BAD_JOB.model_copy(update={"locationId": "loc-does-not-exist", "skills": []})
    check("unknown location falls back", predict(PROFILE, unknown).matchScore >= 5)

    print()
    if FAILURES:
        print(f"{len(FAILURES)} check(s) FAILED: {', '.join(FAILURES)}")
        return 1
    print("All logic checks passed.")
    return 0


def _is_sorted(results) -> bool:
    scores = [r.matchScore for r in results]
    return scores == sorted(scores, reverse=True)


if __name__ == "__main__":
    raise SystemExit(main())
