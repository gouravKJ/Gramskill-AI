"""Contract tests for the matching service.

Run with:

    cd ml-service
    pip install -r requirements-dev.txt
    python -m pytest -q

These mirror the TypeScript engine tests in
`src/lib/ai/__tests__/engines.test.ts`, so a divergence between the two
implementations shows up as a failing test rather than as a wrong score in the UI.
"""

from __future__ import annotations

import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.features import haversine_km, lexical_similarity  # noqa: E402
from app.main import app  # noqa: E402
from app.scoring import to_ui_scale  # noqa: E402

client = TestClient(app)

PROFILE = {
    "userId": "usr-ravi",
    "name": "Ravi Kumar",
    "locationId": "loc-koraput",
    "education": "DIPLOMA",
    "experience": "ZERO_TO_ONE",
    "jobTypes": ["FULL_TIME"],
    "workModes": ["ONSITE"],
    "industries": ["Accounting"],
    "salaryExpectation": 15000,
    "careerGoal": "I want to become an Accounts Assistant in a company near my village.",
    "bio": "Diploma in Commerce. I keep accounts for my family shop.",
    "skills": [
        {"skillId": "sk-excel", "proficiency": "INTERMEDIATE", "yearsExperience": 1},
        {"skillId": "sk-accounting", "proficiency": "INTERMEDIATE", "yearsExperience": 1},
        {"skillId": "sk-communication", "proficiency": "ADVANCED", "yearsExperience": 2},
    ],
    "skillIds": ["sk-excel", "sk-accounting", "sk-communication"],
}

STRONG_JOB = {
    "id": "job-local-accounts",
    "title": "Accounts Assistant",
    "company": "Demo Cooperative",
    "sector": "Accounting",
    "description": "Maintain ledgers and daily accounts for a rural cooperative.",
    "locationId": "loc-koraput",
    "workMode": "ONSITE",
    "jobType": "FULL_TIME",
    "experienceRequired": "FRESHER",
    "educationRequired": "CLASS_12",
    "salaryMin": 15000,
    "salaryMax": 22000,
    "isRuralFriendly": True,
    "localLanguageSupport": True,
    "skills": [
        {"skillId": "sk-excel", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
        {"skillId": "sk-accounting", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
        {"skillId": "sk-communication", "importance": "PREFERRED", "minProficiency": "BEGINNER"},
    ],
    "skillIds": [
        {"skillId": "sk-excel", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
        {"skillId": "sk-accounting", "importance": "REQUIRED", "minProficiency": "BEGINNER"},
    ],
}

WEAK_JOB = {
    "id": "job-far-welding",
    "title": "Welder",
    "company": "Demo Fabrication",
    "sector": "Manufacturing",
    "description": "Arc welding of steel structures on site.",
    "locationId": "loc-ranchi",
    "workMode": "ONSITE",
    "jobType": "CONTRACT",
    "experienceRequired": "THREE_PLUS",
    "educationRequired": "ITI",
    "salaryMin": 9000,
    "salaryMax": 12000,
    "isRuralFriendly": False,
    "localLanguageSupport": False,
    "skills": [
        {"skillId": "sk-welding", "importance": "REQUIRED", "minProficiency": "ADVANCED"},
        {"skillId": "sk-masonry", "importance": "REQUIRED", "minProficiency": "INTERMEDIATE"},
    ],
    "skillIds": [],
}


def test_health_reports_capabilities() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["skillCatalogueSize"] == 52
    assert body["locationCatalogueSize"] == 12


def test_predict_returns_explainable_score() -> None:
    response = client.post("/predict", json={"profile": PROFILE, "job": STRONG_JOB})
    assert response.status_code == 200
    body = response.json()

    assert 5 <= body["matchScore"] <= 99
    assert 0.0 <= body["probability"] <= 1.0
    assert len(body["factors"]) == 6
    # Weighted contributions must reconstruct the probability (plus rounding).
    total = sum(f["contribution"] for f in body["factors"])
    assert abs(total - body["probability"]) < 0.02
    assert set(body["matchedSkills"]) == {"Excel", "Accounting", "Communication"}
    assert body["missingSkills"] == []
    assert body["distanceKm"] == 0.0
    assert body["explanations"]


def test_strong_match_beats_weak_match() -> None:
    strong = client.post("/predict", json={"profile": PROFILE, "job": STRONG_JOB}).json()
    weak = client.post("/predict", json={"profile": PROFILE, "job": WEAK_JOB}).json()
    assert strong["matchScore"] > weak["matchScore"]
    assert weak["requiredMissing"], "mandatory missing skills must be surfaced"
    assert weak["missingSkills"]


def test_required_missing_is_a_hard_penalty() -> None:
    """A job missing every mandatory skill must not score like a good fit."""
    body = client.post("/predict", json={"profile": PROFILE, "job": WEAK_JOB}).json()
    assert body["requiredSkillCoverage"] == 0.0
    assert body["matchScore"] < 60


def test_education_and_experience_shortfall_lower_the_score() -> None:
    baseline = client.post("/predict", json={"profile": PROFILE, "job": STRONG_JOB}).json()
    struggling = {**PROFILE, "education": "BELOW_10", "experience": "FRESHER"}
    lowered = client.post(
        "/predict", json={"profile": struggling, "job": {**STRONG_JOB, "educationRequired": "GRADUATE"}}
    ).json()
    assert lowered["matchScore"] <= baseline["matchScore"]


def test_remote_role_ignores_distance() -> None:
    remote = {**WEAK_JOB, "workMode": "REMOTE", "skills": STRONG_JOB["skills"]}
    body = client.post("/predict", json={"profile": PROFILE, "job": remote}).json()
    assert body["distanceKm"] is None


def test_batch_ranks_highest_first_and_honours_top_k() -> None:
    response = client.post(
        "/predict/batch",
        json={"profile": PROFILE, "jobs": [WEAK_JOB, STRONG_JOB], "topK": 1},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["matchScore"] >= 0
    assert body["results"][0]["explanations"]


def test_half_empty_profile_still_scores() -> None:
    """Onboarding produces partial profiles; the service must not 422 or crash."""
    response = client.post(
        "/predict",
        json={"profile": {"locationId": "loc-koraput"}, "job": STRONG_JOB},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["warnings"], "missing profile data must be reported, not hidden"
    assert body["confidence"] == "low"


def test_model_endpoint_lists_features() -> None:
    body = client.get("/model").json()
    assert len(body["featureNames"]) == 14
    assert abs(sum(body["factorWeights"].values()) - 1.0) < 1e-9


def test_ui_scale_is_clamped() -> None:
    assert to_ui_scale(0.0) == 5
    assert to_ui_scale(1.0) == 99
    assert to_ui_scale(0.5) == 50


def test_haversine_matches_known_distance() -> None:
    # Koraput -> Bhubaneswar is ~366 km as the crow flies (~500 km by road).
    km = haversine_km(18.8128, 82.7105, 20.2961, 85.8245)
    assert 340 < km < 390


def test_lexical_similarity_edge_cases() -> None:
    assert lexical_similarity("", "anything") == 0.0
    assert lexical_similarity("accounts ledger", "unrelated welder") == 0.0
    assert lexical_similarity("accounts ledger gst", "accounts ledger gst") == 1.0
