"""Swap-in matchers.

`registry.matcher()` returns the best ranker available in this environment:

    gradient-boosting  (scikit-learn / XGBoost, trained artifact or boot-trained)
        |
        v  fallback
    heuristic          (pure-Python weighted factors, always available)

Downstream code never imports a concrete model — it asks the registry once.
"""

from .base import Matcher, confidence_for
from .heuristic import HeuristicMatcher
from .registry import (
    cached_matcher,
    matcher,
    model_info,
    reset_matcher,
    warm_in_background,
)

__all__ = [
    "Matcher",
    "HeuristicMatcher",
    "cached_matcher",
    "confidence_for",
    "matcher",
    "model_info",
    "reset_matcher",
    "warm_in_background",
]
