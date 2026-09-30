"""FastAPI entrypoint for the GramSkill AI matching service.

Contract (consumed by `src/app/api/ml/match/route.ts`):

    POST /predict          { profile, job }          -> MatchPrediction
    POST /predict/batch    { profile, jobs, topK }   -> BatchMatchResponse
    GET  /health                                     -> HealthResponse
    GET  /model                                      -> ModelInfoResponse
    GET  /                                           -> service card

Run it with:

    cd ml-service
    uvicorn app.main:app --reload --port 8000

then in the Next.js `.env.local`:

    ML_SERVICE_URL=http://localhost:8000
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from . import __version__, config
from .locations import LOCATIONS
from .log import LOGGER
from .models import matcher, model_info
from .models.embeddings import backend_name, embeddings_available
from .schemas import (
    BatchMatchRequest,
    BatchMatchResponse,
    HealthResponse,
    MatchPrediction,
    MatchRequest,
    ModelInfoResponse,
)
from .scoring import predict, predict_batch
from .skills import SKILLS


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Warm the matcher before the first request.

    Training on boot costs ~3 s on 12,000 rows; doing it here means the first
    `/predict` an evaluator triggers is instant instead of mysteriously slow.
    The chosen matcher and its holdout metrics are logged on startup.
    """
    started = time.perf_counter()
    current = matcher()
    LOGGER.info(
        "ready in %.2fs - matcher=%s (%s), semantic=%s",
        time.perf_counter() - started,
        current.kind,
        current.backend,
        backend_name(),
    )
    yield


app = FastAPI(
    title="GramSkill AI — Matching Service",
    description=(
        "Explainable job-matching service: feature extraction, optional neural "
        "embeddings and a gradient-boosted ranker behind one small HTTP contract."
    ),
    version=__version__,
    lifespan=lifespan,
)

# The service is called server-to-server by Next.js, so CORS only matters for
# local experiments (e.g. opening Swagger UI from a different origin).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root() -> dict[str, object]:
    """Service card — handy when you open the port in a browser."""
    current = matcher()
    return {
        "service": config.SERVICE_NAME,
        "version": __version__,
        "modelVersion": config.MODEL_VERSION,
        "tagline": "From Skills to Opportunities.",
        "matcher": current.describe(),
        "semanticBackend": backend_name(),
        "endpoints": ["/health", "/model", "/predict", "/predict/batch", "/docs"],
    }


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    """Liveness + capability probe.

    The Next.js `/api/health` route reports `ML_SERVICE_URL` as merely
    "configured"; this endpoint is what actually proves the service answers.
    """
    current = matcher()
    return HealthResponse(
        status="healthy",
        service=config.SERVICE_NAME,
        modelVersion=config.MODEL_VERSION,
        engine=config.SERVICE_NAME,
        modelKind=current.kind,
        semanticBackend=backend_name(),
        capabilities={
            "learnedRanker": current.kind != "heuristic",
            "scikitLearn": _installed("sklearn"),
            "xgboost": _installed("xgboost"),
            "sentenceTransformers": embeddings_available(),
        },
        skillCatalogueSize=len(SKILLS),
        locationCatalogueSize=len(LOCATIONS),
    )


@app.get("/model", response_model=ModelInfoResponse, tags=["meta"])
def model(
    reload: bool = Query(False, description="Rebuild the matcher (debugging only)."),
) -> ModelInfoResponse:
    """Describe the active model, its features and the baselines it was measured against."""
    if reload:
        from .models import reset_matcher

        reset_matcher()
    info = model_info()
    return ModelInfoResponse(
        modelVersion=str(info["modelVersion"]),
        engine=str(info["engine"]),
        modelKind=str(info["modelKind"]),
        rankerAvailable=bool(info["rankerAvailable"]),
        semanticBackend=str(info["semanticBackend"]),
        featureNames=list(info["featureNames"]),  # type: ignore[arg-type]
        factorWeights=dict(info["factorWeights"]),  # type: ignore[arg-type]
        notes=list(info["notes"]),  # type: ignore[arg-type]
    )


@app.post("/predict", response_model=MatchPrediction, tags=["matching"])
def predict_one(request: MatchRequest) -> MatchPrediction:
    """Score a single (profile, job) pair with a full explanation."""
    return predict(request.profile, request.job)


@app.post("/predict/batch", response_model=BatchMatchResponse, tags=["matching"])
def predict_many(request: BatchMatchRequest) -> BatchMatchResponse:
    """Rank a pool of jobs for one profile, highest match first."""
    results = predict_batch(request.profile, request.jobs, top_k=request.topK)
    current = matcher()
    return BatchMatchResponse(
        engine=config.SERVICE_NAME,
        modelVersion=config.MODEL_VERSION,
        modelKind=current.kind,
        results=results,
    )


def _installed(module: str) -> bool:
    """Cheap import probe used only by /health (never raises)."""
    import importlib.util

    try:
        return importlib.util.find_spec(module) is not None
    except Exception:  # noqa: BLE001
        return False
