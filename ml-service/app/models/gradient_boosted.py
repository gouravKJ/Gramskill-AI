"""Learned ranker (gradient boosting).

Why this exists
---------------
The weighted-factor score is *linear*: it cannot express interactions such as
"a missing mandatory skill caps the ceiling regardless of everything else" or
"remote work neutralises a long commute". A gradient-boosted tree learns those
interactions from data.

Honest note on the labels
-------------------------
There is no public dataset of Indian rural hiring outcomes bundled with this
academic project, so `synthetic_labels()` generates a target from a documented
formula that includes non-linear interaction terms plus noise. That makes the
whole path — feature extraction → training → artifact persistence → serving
→ holdout metrics — real and production-shaped, while the *ground truth* is
clearly synthetic. Swap `load_training_frame()` for real data and nothing else
changes.
"""

from __future__ import annotations

import os
from typing import Any

import numpy as np

from .. import config
from ..features import FeatureBundle
from ..log import LOGGER
from .base import Matcher

ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
SKLEARN_ARTIFACT = os.path.join(ARTIFACT_DIR, "ranker.joblib")
XGBOOST_ARTIFACT = os.path.join(ARTIFACT_DIR, "ranker.json")

# Feature columns the synthetic generator needs by name.
_IDX = {name: i for i, name in enumerate(config.FEATURE_NAMES)}

# The band every synthetic label lives in. A target fabricated from a formula
# should not claim absolute certainty at either end, and without this the ranker
# pins a genuinely good match at 98-99 on the UI scale — which reads as either a
# bug or an overclaim to anyone evaluating the demo. Applied to the *noisy*
# labels too, so sampling noise cannot push a prediction back to the ceiling.
LABEL_MIN = 0.05
LABEL_MAX = 0.95


def synthetic_labels(matrix: np.ndarray) -> np.ndarray:
    """Documented target function used to fabricate supervised labels.

    Starts from the weighted-factor formula, then adds the interaction effects a
    linear model cannot represent:

      * mandatory-skill blockers dominate (concave penalty)
      * remote work removes the commute, so distance stops mattering
      * rural-friendly employers reward demonstrated skill
      * "has the skill but too shallow" is penalised harder than linearly
    """
    skills = matrix[:, _IDX["skill_match_ratio"]]
    loc = matrix[:, _IDX["location_score"]]
    edu = matrix[:, _IDX["education_score"]]
    exp = matrix[:, _IDX["experience_score"]]
    prefs = matrix[:, _IDX["preference_score"]]
    semantic = matrix[:, _IDX["semantic_similarity"]]
    required_missing = matrix[:, _IDX["required_missing_ratio"]]
    partial = matrix[:, _IDX["partial_skill_ratio"]]
    distance = matrix[:, _IDX["distance_norm"]]
    remote = matrix[:, _IDX["is_remote"]]
    rural = matrix[:, _IDX["rural_friendly"]]
    language = matrix[:, _IDX["local_language"]]

    base = (
        0.42 * skills
        + 0.16 * loc
        + 0.14 * edu
        + 0.12 * exp
        + 0.10 * prefs
        + 0.06 * semantic
    )

    penalty = 0.28 * np.power(required_missing, 0.7)
    bonus = 0.10 * remote * (1.0 - distance)
    bonus += 0.05 * rural * skills
    bonus += 0.02 * language
    bonus -= 0.12 * partial

    raw = np.clip(base - penalty + bonus, 0.0, 1.0)
    return LABEL_MIN + (LABEL_MAX - LABEL_MIN) * raw


def synthetic_dataset(n_samples: int = 12_000, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    """Sample the feature space uniformly and label it.

    Uniform sampling (rather than sampling matched pairs) is deliberate: the
    model must be accurate across the whole space, including the many
    poor-match combinations the heuristic over-scores.
    """
    rng = np.random.default_rng(seed)
    n_features = len(config.FEATURE_NAMES)
    matrix = rng.random((n_samples, n_features))

    # Keep the generator in the region the feature extractor can actually emit.
    matrix[:, _IDX["is_remote"]] = (rng.random(n_samples) < 0.18).astype(float)
    matrix[:, _IDX["rural_friendly"]] = (rng.random(n_samples) < 0.45).astype(float)
    matrix[:, _IDX["local_language"]] = (rng.random(n_samples) < 0.5).astype(float)
    matrix[:, _IDX["matched_skill_coverage"]] = np.clip(
        matrix[:, _IDX["skill_match_ratio"]] + rng.normal(0, 0.08, n_samples), 0.0, 1.0
    )
    matrix[:, _IDX["required_missing_ratio"]] = np.clip(
        1.0 - matrix[:, _IDX["matched_skill_coverage"]] + rng.normal(0, 0.2, n_samples), 0.0, 1.0
    )
    matrix[:, _IDX["partial_skill_ratio"]] = np.clip(
        rng.beta(2, 6, n_samples) * (1.0 - matrix[:, _IDX["matched_skill_coverage"]]),
        0.0,
        1.0,
    )
    matrix[:, _IDX["distance_norm"]] = np.clip(
        matrix[:, _IDX["distance_norm"]] * (1.0 - matrix[:, _IDX["is_remote"]]), 0.0, 1.0
    )

    labels = synthetic_labels(matrix)
    labels = np.clip(labels + rng.normal(0, 0.03, n_samples), LABEL_MIN, LABEL_MAX)
    return matrix, labels


def train_ranker(n_samples: int = 12_000, seed: int = 7) -> tuple[Any, dict[str, float], str]:
    """Train a gradient-boosted regressor. Returns (model, metrics, backend)."""
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.metrics import mean_absolute_error, r2_score
    from sklearn.model_selection import train_test_split

    matrix, labels = synthetic_dataset(n_samples=n_samples, seed=seed)
    x_train, x_test, y_train, y_test = train_test_split(matrix, labels, test_size=0.2, random_state=seed)

    backend = "sklearn GradientBoostingRegressor"
    try:  # XGBoost tends to be stronger when the wheel is available.
        from xgboost import XGBRegressor  # type: ignore

        model = XGBRegressor(
            n_estimators=320,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            objective="reg:squarederror",
            n_jobs=2,
            random_state=seed,
        )
        backend = "XGBRegressor"
    except Exception:  # noqa: BLE001 - sklearn alone is fine
        model = GradientBoostingRegressor(
            n_estimators=260,
            max_depth=3,
            learning_rate=0.06,
            subsample=0.9,
            random_state=seed,
        )

    model.fit(x_train, y_train)
    predictions = np.clip(model.predict(x_test), 0.0, 1.0)

    # Baseline: what the linear heuristic would score on the same holdout.
    baseline_weights = np.array([config.FACTOR_WEIGHTS[k] for k in (
        "skills", "location", "education", "experience", "preferences", "semantic",
    )])
    baseline = np.clip(
        x_test[:, [_IDX["skill_match_ratio"], _IDX["location_score"], _IDX["education_score"],
                   _IDX["experience_score"], _IDX["preference_score"], _IDX["semantic_similarity"]]]
        @ baseline_weights,
        0.0,
        1.0,
    )

    metrics = {
        "holdoutR2": round(float(r2_score(y_test, predictions)), 4),
        "holdoutMae": round(float(mean_absolute_error(y_test, predictions)), 4),
        "linearBaselineR2": round(float(r2_score(y_test, baseline)), 4),
        "linearBaselineMae": round(float(mean_absolute_error(y_test, baseline)), 4),
        "trainRows": float(len(x_train)),
    }
    return model, metrics, backend


def save_artifact(model: Any, backend: str) -> str | None:
    """Persist the trained model so boots are instant afterwards."""
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    try:
        if backend == "XGBRegressor":
            model.save_model(XGBOOST_ARTIFACT)
            return XGBOOST_ARTIFACT
        import joblib  # type: ignore

        joblib.dump(model, SKLEARN_ARTIFACT)
        return SKLEARN_ARTIFACT
    except Exception:  # noqa: BLE001 - persistence is a nice-to-have
        return None


def load_artifact() -> tuple[Any, str] | None:
    """Load a previously saved model, preferring the XGBoost artifact."""
    if os.path.exists(XGBOOST_ARTIFACT):
        try:
            from xgboost import XGBRegressor  # type: ignore

            model = XGBRegressor()
            model.load_model(XGBOOST_ARTIFACT)
            return model, "XGBRegressor (cached artifact)"
        except Exception:  # noqa: BLE001
            pass
    if os.path.exists(SKLEARN_ARTIFACT):
        try:
            import joblib  # type: ignore

            return joblib.load(SKLEARN_ARTIFACT), "sklearn GradientBoostingRegressor (cached artifact)"
        except Exception:  # noqa: BLE001
            pass
    return None


class GradientBoostedMatcher(Matcher):
    kind = "gradient-boosting"

    def __init__(self, model: Any, backend: str, metrics: dict[str, float] | None = None):
        self._model = model
        self.backend = backend
        self.metrics = metrics or {}

    def score(self, bundle: FeatureBundle) -> float:
        row = np.asarray([bundle.vector], dtype=float)
        prediction = float(self._model.predict(row)[0])
        return max(0.0, min(1.0, prediction))

    def describe(self) -> dict[str, object]:
        return {"kind": self.kind, "backend": self.backend, "metrics": self.metrics}


def build() -> GradientBoostedMatcher | None:
    """Try to build a usable learned ranker, or return None.

    Never raises: a missing scikit-learn, a corrupt artifact or a failed boot
    training all simply degrade to the heuristic matcher.
    """
    if config.MODEL_CHOICE == "heuristic":
        return None

    cached = load_artifact()
    if cached is not None:
        model, backend = cached
        return GradientBoostedMatcher(model, backend)

    if not config.TRAIN_ON_BOOT:
        return None

    try:
        model, metrics, backend = train_ranker()
    except Exception as exc:  # noqa: BLE001
        LOGGER.warning(
            "ranker unavailable (%s: %s); using heuristic", exc.__class__.__name__, exc
        )
        return None

    save_artifact(model, backend)
    # ASCII-only log strings: Windows consoles default to cp1252 and would turn
    # an em dash into mojibake in redirected logs.
    LOGGER.info(
        "trained ranker (%s) - holdout R2 %s vs linear baseline %s",
        backend,
        metrics["holdoutR2"],
        metrics["linearBaselineR2"],
    )
    return GradientBoostedMatcher(model, backend, metrics)
