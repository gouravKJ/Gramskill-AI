# ---------------------------------------------------------------------------
# GramSkill AI — matching service
#
#   docker build -t gramskill-ml ml-service
#   docker run -p 8000:8000 gramskill-ml
#
# Uses the light image (no PyTorch). For the embeddings backend,
# swap the base image for a CUDA one and install requirements-embeddings.txt.
# ---------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies first so the layer caches across source edits.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY training ./training

# Boot training needs to be able to write its artifact.
RUN mkdir -p app/models/artifacts

# Render/Railway/Fly inject $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import os,urllib.request;urllib.request.urlopen('http://127.0.0.1:'+os.getenv('PORT','8000')+'/health',timeout=4)"

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
