"""The Matcher contract.

A matcher turns a `FeatureBundle` into a probability in [0, 1]. Nothing else.
Keeping the interface this narrow is what allows the heuristic scorer, a
gradient-boosted ranker and (later) a transformer reranker to be dropped in
without touching the API layer.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..features import FeatureBundle


class Matcher(ABC):
    """Base class for every ranking strategy."""

    #: stable identifier surfaced in API responses ("heuristic", "gradient-boosting")
    kind: str = "heuristic"
    #: free-form backend description, e.g. "sklearn GradientBoostingRegressor"
    backend: str = "weighted-factors"

    @abstractmethod
    def score(self, bundle: FeatureBundle) -> float:
        """Return a match probability in [0, 1]."""

    @property
    def available(self) -> bool:
        return True

    def describe(self) -> dict[str, object]:
        return {"kind": self.kind, "backend": self.backend}


def confidence_for(bundle: FeatureBundle, probability: float) -> str:
    """Bucket the prediction into high / medium / low.

    Confidence is deliberately *model-independent*: it describes how much the
    profile actually told us, not how sure a particular model is. A 90% match
    built from an empty profile should never read as "high confidence".
    """
    skills = bundle.skills
    features = bundle.features

    information = (
        (1.0 if features["education_score"] != 0.6 else 0.0)
        + (1.0 if features["experience_score"] != 0.6 else 0.0)
        + min(1.0, features["matched_skill_coverage"] * 2)
        + (1.0 if features["semantic_similarity"] > 0.05 else 0.0)
    ) / 4.0

    if probability >= 0.70 and information >= 0.6 and not skills.required_missing:
        return "high"
    if probability <= 0.35 or features["skill_match_ratio"] < 0.25 or information < 0.3:
        return "low"
    return "medium"
