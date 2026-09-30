# GramSkill AI — Matching Service (Python / FastAPI)

Explainable job matching for rural job seekers. This service is **optional**: the
Next.js app ships a TypeScript matcher that produces the same scores, and uses it
automatically whenever `ML_SERVICE_URL` is unset or unreachable.

```
Profile + Job
      │
      ▼
Feature extraction          app/features.py      14 numeric features, all explainable
      │
      ▼
Text → Embedding            app/models/embeddings.py
      │                     sentence-transformers when installed, else lexical cosine
      ▼
Similarity                  cosine, in [0, 1]
      │
      ▼
ML ranking                  app/models/gradient_boosted.py
      │                     XGBoost / scikit-learn, registry-selected
      ▼
Final job recommendation    app/scoring.py        score on the shared 5–99 UI scale
```

---

## Quick start

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

From the project root the equivalent npm scripts are:

```bash
npm run ml:install     # pip install -r ml-service/requirements.txt
npm run ml:dev         # cd ml-service && uvicorn app.main:app --reload --port 8000
```

Then point the Next.js app at it — add to `.env.local`:

```bash
ML_SERVICE_URL=http://localhost:8000
```

Restart `npm run dev` and `http://localhost:3222/api/health` reports the service
as `configured`. `POST /api/ml/match` with `{ "jobId": "..." }` will then return
`engine: "python-ml-service"` alongside the local TypeScript score, so you can
compare the two engines side by side.

Interactive API docs: <http://localhost:8000/docs>.

---

## Endpoints

| Method | Path              | Purpose                                                     |
| ------ | ----------------- | ----------------------------------------------------------- |
| `GET`  | `/`               | Service card — matcher, backend, endpoint list               |
| `GET`  | `/health`         | Liveness + capability probe (which optional deps loaded)     |
| `GET`  | `/model`          | Active model, feature names, factor weights, training notes  |
| `POST` | `/predict`        | Score one `(profile, job)` pair with a full explanation      |
| `POST` | `/predict/batch`  | Rank a pool of jobs, highest match first                     |

### `POST /predict`

Request — same camelCase vocabulary as the TypeScript domain types:

```json
{
  "profile": {
    "userId": "usr-ravi",
    "locationId": "loc-koraput",
    "education": "DIPLOMA",
    "experience": "ZERO_TO_ONE",
    "careerGoal": "I want to become an Accounts Assistant near my village.",
    "skills": [
      { "skillId": "sk-excel", "proficiency": "INTERMEDIATE", "yearsExperience": 1 },
      { "skillId": "sk-accounting", "proficiency": "INTERMEDIATE" }
    ]
  },
  "job": {
    "id": "job-accounts-assistant",
    "title": "Accounts Assistant",
    "locationId": "loc-koraput",
    "workMode": "ONSITE",
    "educationRequired": "CLASS_12",
    "experienceRequired": "FRESHER",
    "skills": [
      { "skillId": "sk-excel", "importance": "REQUIRED", "minProficiency": "BEGINNER" },
      { "skillId": "sk-tally", "importance": "PREFERRED", "minProficiency": "INTERMEDIATE" }
    ]
  }
}
```

Response (abridged):

```json
{
  "engine": "gramskill-ml",
  "modelKind": "gradient-boosting",
  "semanticBackend": "lexical",
  "matchScore": 91,
  "probability": 0.914,
  "baselineProbability": 0.883,
  "confidence": "high",
  "factors": [
    { "key": "skills",   "label": "Skill match", "score": 0.84, "weight": 0.42,
      "contribution": 0.3528, "detail": "You already have 1 of 2 listed skills." },
    { "key": "location", "label": "Location",    "score": 1.0,  "weight": 0.16, "...": "..." }
  ],
  "matchedSkills": ["Excel"],
  "partialSkills": [],
  "missingSkills": ["Tally Prime"],
  "requiredMissing": [],
  "requiredSkillCoverage": 1.0,
  "distanceKm": 0.0,
  "explanations": ["Your Excel skills are used in this role.", "Only about 0 km from your location — a manageable daily commute."],
  "warnings": [],
  "latencyMs": 1.8
}
```

Two score fields, and the difference is deliberate:

- **`probability`** — the output of whichever model is active. This drives
  `matchScore`.
- **`baselineProbability`** — exactly what the six weighted factors add up to.
  `factors[].contribution` always reconstructs *this*, never `probability`.

With `ML_MODEL=heuristic` the two are identical and the response is numerically
equivalent to `src/lib/ai/match-engine.ts`.

---

## The model

**Features (14)** — defined once in `app/config.py` as `FEATURE_NAMES`, produced
by `app/features.py`. Appending a feature is a breaking change for a saved
artifact, so add new columns at the end and bump `MODEL_VERSION`.

| Feature                   | Meaning                                              |
| ------------------------- | ---------------------------------------------------- |
| `skill_match_ratio`       | Importance-weighted skill overlap, partial credit 0.6 |
| `required_missing_ratio`  | Share of *mandatory* skills the candidate lacks       |
| `partial_skill_ratio`     | Has the skill but below the required proficiency      |
| `matched_skill_coverage`  | Plain fraction of listed skills met                   |
| `education_score` / `experience_score` | Ordinal comparison against the posting   |
| `location_score` / `distance_norm` / `is_remote` | Commute feasibility          |
| `preference_score` / `salary_fit` | Stated preferences vs. the offer              |
| `semantic_similarity`     | Profile ↔ job-description similarity                  |
| `rural_friendly` / `local_language` | Employer signals that matter for this audience |

**Why a learned ranker on top of the weighted formula?** The linear score cannot
express interactions such as *"one missing mandatory skill caps the ceiling
regardless of everything else"*, *"remote work neutralises a 340 km commute"*, or
*"having a skill below the required level hurts more than the linear term
suggests"*. Gradient-boosted trees learn those from data.

**On the training labels — read this before quoting the metrics.** There is no
public dataset of Indian rural hiring outcomes bundled with this project, so
`gradient_boosted.synthetic_labels()` fabricates a target from a documented
formula that includes the non-linear interaction terms above, plus Gaussian
noise. What is *real* is the entire path: feature extraction → training → holdout
evaluation → artifact persistence → serving → explanation. Replace
`load_training_frame()` with real outcomes (e.g. which applicants were actually
shortlisted) and nothing else changes.

**Why scores top out around 95.** Synthetic labels live in a `[0.05, 0.95]` band
(`LABEL_MIN` / `LABEL_MAX`). Nothing downstream of a formula-generated target
should claim absolute certainty, and without the band the ranker pinned a good
match at 98–99 on the UI scale, which reads as a bug or an overclaim rather than
as a strong result. The band is applied *after* label noise, so sampling noise
cannot push a prediction back to the ceiling either.

Typical holdout results at 12,000 rows:

| Model                | R²     | MAE    |
| -------------------- | ------ | ------ |
| Linear baseline      | 0.4440 | 0.1305 |
| Gradient-boosted     | 0.9734 | 0.0263 |

Those numbers measure *the ranker reproducing the synthetic label*, not
real-world hiring accuracy. They are reported because the gap against the linear
baseline demonstrates the interaction effects are genuinely being learned.

### Retraining

```bash
npm run ml:train              # or: cd ml-service && python -m training.train_ranker
python -m training.train_ranker --rows 50000 --seed 11
python -m training.train_ranker --report-only --json
```

Artifacts land in `app/models/artifacts/` (gitignored). On boot the service loads
a cached artifact if present, otherwise it trains one (~3 s at 12,000 rows) and
saves it. Set `ML_TRAIN_ON_BOOT=0` to disable the boot-time fallback.

The startup log line tells you exactly what is serving requests — for example:

```
[ml] trained ranker (XGBRegressor) - holdout R2 0.9734 vs linear baseline 0.444
[ml] ready in 3.47s - matcher=gradient-boosting (XGBRegressor), semantic=lexical
```

---

## Configuration

| Variable                | Default                        | Effect                                               |
| ----------------------- | ------------------------------ | ---------------------------------------------------- |
| `ML_MODEL`              | `auto`                         | `auto`, `gbm` or `heuristic` — forces a scorer        |
| `ML_SEMANTIC_BACKEND`   | `auto`                         | `auto`, `embeddings` or `lexical`                     |
| `ML_EMBEDDING_MODEL`    | `all-MiniLM-L6-v2`             | Any sentence-transformers model id                    |
| `ML_TRAIN_ON_BOOT`      | `1`                            | Train a synthetic ranker when no artifact exists      |

## Degraded modes

The service is designed so that **nothing about it can break a demo**:

| Missing                | Behaviour                                                    |
| ---------------------- | ------------------------------------------------------------ |
| scikit-learn + XGBoost | Falls back to the weighted-factor scorer (identical scores to the TS engine) |
| sentence-transformers  | Falls back to dependency-free lexical cosine                 |
| Saved artifact         | Trains one at boot, or falls back to the heuristic            |
| Python entirely        | Next.js uses its in-process TypeScript matcher                |

`GET /health` reports which capabilities actually loaded, so the UI never claims
more than it is doing.

---

## Tests

```bash
cd ml-service
python tests/verify_logic.py                 # no web server, no network needed
pip install -r requirements-dev.txt
python -m pytest -q                          # full API contract tests
```

`verify_logic.py` is the fast path — it exercises feature extraction, the
ranker, the training pipeline and edge cases (empty profile, unknown location,
very long text) without needing FastAPI or a running server.

`tests/test_service.py` mirrors `src/lib/ai/__tests__/engines.test.ts` so a
divergence between the two engines shows up as a failing test rather than as a
wrong number in the UI.

---

## Troubleshooting

**`TypeError: Router.__init__() got an unexpected keyword argument 'on_startup'`**

A mismatched global FastAPI/Starlette pair — FastAPI was upgraded without
Starlette, or vice versa. This happens with system-wide installs that other
projects also mutate. Always install into the local virtualenv described in
[Quick start](#quick-start); if you must use the global interpreter:

```bash
python -m pip install --upgrade "fastapi>=0.115" "starlette>=0.40"
```

**The service starts but no `[ml] …` lines appear**

You are probably looking at a log file rather than a terminal. Diagnostics go
through `app/log.py`, which flushes per record — if output is still missing, the
process was started before the file existed.

**Scores differ from the Next.js matcher**

Expected when the learned ranker is active: compare `probability` against
`baselineProbability` in the response. With `ML_MODEL=heuristic` the two engines
agree to within rounding, since the semantic factor then falls back to the
dependency-free lexical backend instead of corpus TF-IDF.

## Docker

```bash
docker build -t gramskill-ml ml-service
docker run -p 8000:8000 gramskill-ml
```

On Render/Railway/Fly, set the build context to `ml-service` and expose `$PORT`
(the image already honours it). For the embeddings backend, install
`requirements-embeddings.txt` instead — note that pulls in PyTorch (~2 GB).
