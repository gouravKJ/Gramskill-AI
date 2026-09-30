"""Configuration for the matcher.

Every number that influences a score lives here, in one place, mirroring the
TypeScript engine in `src/lib/ai/match-engine.ts`. Keeping the two in sync is a
deliberate design choice: the Python service can be swapped in and out without
the ranking changing shape, so an evaluator comparing both gets the same answer.
"""

from __future__ import annotations

import os
from typing import Final

SERVICE_NAME: Final[str] = "gramskill-ml"
MODEL_VERSION: Final[str] = "2026.1"

# --- ranking weights (must sum to 1.0) --------------------------------------
# Mirrors MATCH_WEIGHTS in src/lib/ai/match-engine.ts.
FACTOR_WEIGHTS: Final[dict[str, float]] = {
    "skills": 0.42,
    "location": 0.16,
    "education": 0.14,
    "experience": 0.12,
    "preferences": 0.10,
    "semantic": 0.06,
}

FACTOR_LABELS: Final[dict[str, str]] = {
    "skills": "Skill match",
    "location": "Location",
    "education": "Education",
    "experience": "Experience",
    "preferences": "Preferences",
    "semantic": "Profile similarity",
}

# How much a job requirement counts, by importance.
IMPORTANCE_WEIGHT: Final[dict[str, float]] = {
    "REQUIRED": 1.0,
    "PREFERRED": 0.55,
    "OPTIONAL": 0.25,
}

# Ordinal scales. Order matters — these are used for "does the user meet it?".
EDUCATION_ORDER: Final[dict[str, int]] = {
    "BELOW_10": 0,
    "CLASS_10": 1,
    "CLASS_12": 2,
    "ITI": 3,
    "DIPLOMA": 4,
    "GRADUATE": 5,
    "POST_GRADUATE": 6,
}

EXPERIENCE_ORDER: Final[dict[str, int]] = {
    "FRESHER": 0,
    "ZERO_TO_ONE": 1,
    "ONE_TO_THREE": 2,
    "THREE_PLUS": 3,
}

PROFICIENCY_ORDER: Final[dict[str, int]] = {
    "BEGINNER": 1,
    "INTERMEDIATE": 2,
    "ADVANCED": 3,
}

# --- score presentation -----------------------------------------------------
SCORE_MIN: Final[int] = 5
SCORE_MAX: Final[int] = 99

# --- distance model ---------------------------------------------------------
FULL_SCORE_KM: Final[float] = 25.0   # no penalty up to this commuting radius
DECAY_KM: Final[float] = 250.0       # normalisation horizon for the feature vector

# --- feature vector ---------------------------------------------------------
# The exact column order the trained ranker expects. Appending a feature is a
# breaking change for a saved artifact, so keep new columns at the end and bump
# MODEL_VERSION.
FEATURE_NAMES: Final[tuple[str, ...]] = (
    "skill_match_ratio",
    "required_missing_ratio",
    "partial_skill_ratio",
    "matched_skill_coverage",
    "education_score",
    "experience_score",
    "location_score",
    "distance_norm",
    "is_remote",
    "preference_score",
    "salary_fit",
    "semantic_similarity",
    "rural_friendly",
    "local_language",
)

# --- environment switches ---------------------------------------------------
# auto (default) | gbm | heuristic  — forces a specific ranker
MODEL_CHOICE: str = os.getenv("ML_MODEL", "auto").strip().lower()
# lexical (default) | embeddings | auto
SEMANTIC_BACKEND: str = os.getenv("ML_SEMANTIC_BACKEND", "auto").strip().lower()
EMBEDDING_MODEL_NAME: str = os.getenv("ML_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
# Train a synthetic ranker at boot when no artifact has been saved yet.
TRAIN_ON_BOOT: bool = os.getenv("ML_TRAIN_ON_BOOT", "1") not in {"0", "false", "no"}
