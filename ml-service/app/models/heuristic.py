"""Heuristic matcher — the always-available baseline.

Computes the same weighted-factor score as the TypeScript engine in
`src/lib/ai/match-engine.ts`. Its job is to guarantee *parity*: with no
scikit-learn installed, the Python service still returns a number the Next.js
layer can trust and explain.
"""

from __future__ import annotations

from .. import config
from ..features import FeatureBundle
from .base import Matcher


class HeuristicMatcher(Matcher):
    kind = "heuristic"
    backend = "weighted-factors (mirrors src/lib/ai/match-engine.ts)"

    def score(self, bundle: FeatureBundle) -> float:
        total = sum(
            bundle.factor_scores[key] * weight
            for key, weight in config.FACTOR_WEIGHTS.items()
        )
        return max(0.0, min(1.0, total))
