"""Matcher registry.

Instantiated once per process (the model is stateless at inference time, so a
module-level singleton is safe under uvicorn workers). `reset_matcher()` exists
for tests and for `/model?reload=1`-style experiments.
"""

from __future__ import annotations

import threading

from .. import config
from ..log import LOGGER
from .base import Matcher
from .heuristic import HeuristicMatcher

_LOCK = threading.Lock()
_INSTANCE: Matcher | None = None
_NOTES: list[str] = []


def matcher() -> Matcher:
    global _INSTANCE
    if _INSTANCE is not None:
        return _INSTANCE

    with _LOCK:
        if _INSTANCE is not None:  # double-checked: another thread won the race
            return _INSTANCE

        def build_heuristic(reason: str) -> Matcher:
            _NOTES.append(reason)
            LOGGER.info("%s", reason)
            return HeuristicMatcher()

        if config.MODEL_CHOICE == "heuristic":
            _INSTANCE = build_heuristic("ML_MODEL=heuristic — using the weighted-factor scorer")
            return _INSTANCE

        try:
            from .gradient_boosted import build as build_ranker

            ranker = build_ranker()
        except Exception as exc:  # noqa: BLE001 - never fail a request over this
            ranker = None
            _NOTES.append(f"ranker import failed: {exc.__class__.__name__}: {exc}")

        if ranker is not None:
            metrics = getattr(ranker, "metrics", {}) or {}
            if metrics:
                _NOTES.append(
                    "holdout R2 {holdoutR2} vs linear baseline {linearBaselineR2}".format(**metrics)
                )
            _NOTES.append(f"backend: {ranker.backend}")
            _INSTANCE = ranker
        else:
            _INSTANCE = build_heuristic(
                "no learned ranker available — using the weighted-factor scorer"
            )
        return _INSTANCE


def cached_matcher() -> Matcher | None:
    """The already-built matcher, or None. Never triggers construction.

    Liveness probes must answer instantly, so `/health` uses this rather than
    `matcher()`: building the ranker means importing XGBoost/scikit-learn and
    fitting a model, which is far too slow to sit inside a health check.
    """
    return _INSTANCE


def warm_in_background() -> threading.Thread:
    """Build the matcher off the startup critical path.

    uvicorn only opens its listening socket *after* the lifespan startup hook
    returns, so training here would keep the port closed on a throttled
    instance and Render would report the container as having no open ports.
    Warming on a daemon thread lets the port open immediately while the model
    is still prepared before real traffic arrives.
    """

    def _run() -> None:
        try:
            matcher()
        except Exception as exc:  # noqa: BLE001 - warm-up must never crash boot
            LOGGER.warning(
                "background warm-up failed (%s: %s)", exc.__class__.__name__, exc
            )

    thread = threading.Thread(target=_run, name="matcher-warmup", daemon=True)
    thread.start()
    return thread


def model_info() -> dict[str, object]:
    """Metadata for `/model` and the app's engine-status panel."""
    from .embeddings import backend_name, embeddings_available

    current = matcher()
    return {
        "modelVersion": config.MODEL_VERSION,
        "engine": config.SERVICE_NAME,
        "modelKind": current.kind,
        "backend": current.backend,
        "rankerAvailable": current.kind != "heuristic",
        "semanticBackend": backend_name(),
        "embeddingsInstalled": embeddings_available(),
        "featureNames": list(config.FEATURE_NAMES),
        "factorWeights": dict(config.FACTOR_WEIGHTS),
        "notes": list(_NOTES),
    }


def reset_matcher() -> None:
    """Drop the cached matcher (used by tests)."""
    global _INSTANCE
    with _LOCK:
        _INSTANCE = None
