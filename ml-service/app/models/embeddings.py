"""Semantic similarity backends.

Order of preference:

1. `sentence-transformers` (real neural embeddings) — only if installed.
2. Lexical cosine over sublinear term frequencies — always available.

Both return a value in [0, 1] on the *same* scale, so the semantic factor keeps
its 0.06 weight either way and rankings stay stable. The backend actually in use
is reported in every response (`semanticBackend`), so the demo never overstates
what it is doing.
"""

from __future__ import annotations

import os
from functools import lru_cache

from .. import config
from ..features import lexical_similarity

_MODEL = None
_BACKEND = "lexical"


def _try_load_embeddings():
    global _MODEL, _BACKEND
    if _MODEL is not None or _BACKEND == "embeddings":
        return
    if config.SEMANTIC_BACKEND == "lexical":
        return
    try:  # pragma: no cover - depends on an optional heavy dependency
        from sentence_transformers import SentenceTransformer  # type: ignore

        # Keep the model cache inside the service directory so a demo laptop
        # does not silently fill the user profile with a 90 MB download.
        os.environ.setdefault("HF_HOME", os.path.join(os.path.dirname(__file__), "..", "..", ".cache"))
        _MODEL = SentenceTransformer(config.EMBEDDING_MODEL_NAME)
        _BACKEND = "embeddings"
    except Exception:  # noqa: BLE001 - any import/runtime failure falls back
        _MODEL = None
        _BACKEND = "lexical"


def backend_name() -> str:
    _try_load_embeddings()
    return _BACKEND


def _embedding_similarity(text_a: str, text_b: str) -> float:
    assert _MODEL is not None
    vectors = _MODEL.encode([text_a, text_b], normalize_embeddings=True)
    # Normalised vectors => dot product is the cosine similarity.
    return float(max(0.0, min(1.0, vectors[0] @ vectors[1])))


@lru_cache(maxsize=512)
def pair_similarity(text_a: str, text_b: str) -> float:
    """Similarity between two documents, using the best backend available.

    Cached because a batch ranking call repeatedly compares one profile document
    against many job documents — and because the same job text is scored for
    every request during a demo.
    """
    if not text_a or not text_b:
        return 0.0
    _try_load_embeddings()
    if _MODEL is not None:
        try:
            return round(_embedding_similarity(text_a, text_b), 4)
        except Exception:  # noqa: BLE001 - never let the optional path break a request
            pass
    return lexical_similarity(text_a, text_b)


def embeddings_available() -> bool:
    """Cheap capability probe used by /health (never raises)."""
    try:
        import sentence_transformers  # type: ignore  # noqa: F401

        return True
    except Exception:  # noqa: BLE001
        return False
