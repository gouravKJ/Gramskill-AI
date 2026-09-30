# GramSkill AI

**AI-Based Rural Skill Matching & Employment System**

> _From Skills to Opportunities._

An AI-powered employment and skill-development platform for rural job seekers:
discover suitable jobs, understand exactly which skills are missing, find the
training that closes those gaps, and get help through the application process
from an agentic AI assistant.

Runs locally with **zero infrastructure** — the bundled demo dataset is
in-memory, so there is no database, no API key and no ML service required to see
the complete product.

---

## Table of contents

- [The journey](#the-journey)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [What to look at first](#what-to-look-at-first-3-minute-tour)
- [Feature map](#feature-map)
- [Architecture](#architecture)
- [The AI layer](#the-ai-layer)
- [The agentic assistant](#the-agentic-assistant)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [PostgreSQL mode](#postgresql-mode)
- [Python ML service](#python-ml-service)
- [Accessibility & language](#accessibility--language)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project layout](#project-layout)
- [Honest limitations](#honest-limitations)

---

## The journey

```
Register / Log in
      ↓
Create career profile        (6-step onboarding wizard)
      ↓
AI skill analysis            Profile completion + match score
      ↓
Skill gap detection          Which skills, how important, how long to learn
      ↓
AI job matching              Weighted, explainable scoring over 43 demo jobs
      ↓
Personalised recommendations  Ranked jobs with "Why this match?"
      ↓
Agentic AI job assistant     Tool-calling chat: search, explain, plan, draft
      ↓
Application assistance       AI drafts → user approves → recorded
      ↓
Application tracking         Kanban across the real status pipeline
      ↓
Training recommendations     Learning paths generated from the gaps
      ↓
 Better job recommendations
```

---

## Quick start

**Requirements:** Node.js 20+ (developed on 23), npm 10+. Nothing else.

```bash
npm install
npm run dev
```

Open **<http://localhost:3000>**. That is the whole setup — `DATA_SOURCE=demo` is
the default and everything is bundled.

```bash
cp .env.example .env.local     # optional; only needed to change defaults
```

> The app was developed against port 3000. If it is taken, Next.js picks the next
> free port and prints it.

### All scripts

| Script              | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Development server                                               |
| `npm run build`     | Production build (typechecks + lints)                            |
| `npm start`         | Serve the production build                                       |
| `npm run typecheck` | `tsc --noEmit`                                                   |
| `npm test`          | Unit tests for the engines (`node --test` + `tsx`)                |
| `npm run setup`     | `prisma generate` + `db push` + seed — **PostgreSQL mode only**  |
| `npm run db:studio` | Prisma Studio against a real database                            |
| `npm run ml:install`| Install the Python service's dependencies                        |
| `npm run ml:dev`    | Run the FastAPI matching service on `:8000`                      |
| `npm run ml:train`  | Retrain the Python ranker and cache the artifact                 |
| `npm run ml:test`   | Python API contract tests (`pytest`)                             |

---

## Demo accounts

All demo passwords are `demo1234`. Data is entirely fictional; companies and
locations are labelled `(Demo)` in the UI.

| Role       | Email                    | Persona                                              |
| ---------- | ------------------------ | ---------------------------------------------------- |
| **Seeker** | `ravi@gramskill.demo`    | **Ravi Kumar** — Diploma, Excel/Accounting/Communication, rural Koraput, goal: Accounts Assistant |
| Admin      | `admin@gramskill.demo`   | Platform admin — jobs, programmes, analytics          |

Twelve more seeded seekers (`sita@`, `bikash@`, `laxmi@`, `anil@`, …) exist so the
admin analytics and insights pages are populated.

On `/login`, press **Explore Demo** to sign in as Ravi in one click.

---

## What to look at first (3-minute tour)

1. **`/`** — landing page. Hero, feature grid, the eight-step timeline, and the
   animated *From Skill to Employment* pipeline.
2. **Explore Demo → `/dashboard`** — match score, top match, skill gaps, active
   applications, training recommendations, and three charts.
3. **`/jobs`** — 43 ranked jobs with match percentages, filters and pagination.
   Open any job → **Why This Match?** → a factor-by-factor breakdown.
4. **`/skill-gaps`** — coverage score, missing skills ranked by importance and
   demand, estimated learning time, and a **Start Learning Path** button.
5. **`/training`** — the AI-generated learning path for the career goal, with
   progress bars and enrolment.
6. **`/agent`** — the headline feature. Try:
   - `Find accounting jobs within 30 km`
   - `What skills am I missing?`
   - `Which job is best matched to my skills?`
   - `Help me apply for this job` → **approval gate** → *Confirm & Submit*
7. **`/applications`** — Kanban board; the application from step 6 is now there.
8. **`/insights`** — AI insights computed from live records.
9. **`/admin`** (sign in as admin) — platform analytics, job and programme
   management.
10. **`/map`**, **`/opportunities`** — local map and government/community
    opportunity discovery.

---

## Feature map

| # | Feature                       | Where                                                              |
| - | ----------------------------- | ------------------------------------------------------------------ |
| 1 | AI job matching               | `src/lib/ai/match-engine.ts`, `/jobs`, `/api/recommendations`        |
| 2 | Skill gap detection           | `src/lib/ai/skill-gap.ts`, `/skill-gaps`                            |
| 3 | Personalised training         | `buildLearningPath()` in the same module, `/training`               |
| 4 | Agentic AI assistant          | `src/lib/ai/agent/*`, `/agent`                                      |
| 5 | Application assistance        | `prepareApplication` tool + approval gate                           |
| 6 | Application tracking          | `/applications`, `src/components/applications/kanban.tsx`           |
| 7 | Rural opportunity discovery   | `/opportunities`, `/map`, `OpportunitySource` on every job          |
| 8 | Admin dashboard               | `/admin`, `/api/admin/*`                                            |
| 9 | AI insights                   | `src/lib/server/analytics.ts`, `/insights`                          |
| – | Hindi / English               | `src/lib/i18n.ts`, language toggle in the top bar                   |
| – | Accessibility modes           | `src/components/shared/accessibility-menu.tsx`                      |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ Next.js 15 · App Router · React 19 · TypeScript strict               │
│                                                                      │
│  (marketing)      public landing pages, no auth                       │
│  (auth)           login / register                                    │
│  (app)            dashboard, jobs, skill-gaps, training, agent,       │
│                   applications, map, opportunities, insights,         │
│                   profile, onboarding, admin                          │
│                                                                      │
│  middleware.ts    edge route protection + role gate                   │
│  app/api/**       30+ REST route handlers                             │
└───────────────┬──────────────────────────────────────────────────────┘
                │  one interface, two implementations
                ▼
      ┌────────────────────────┐        ┌──────────────────────────┐
      │  DemoRepository        │        │  PrismaRepository        │
      │  in-memory dataset     │  or    │  PostgreSQL via Prisma   │
      │  DATA_SOURCE=demo      │        │  DATA_SOURCE=postgres    │
      └────────────────────────┘        └──────────────────────────┘
                │
                ▼
      ┌────────────────────────────────────────────────────────────┐
      │  AI layer                                                  │
      │  match-engine · skill-gap · nlp (TF-IDF) · planner · tools │
      │  optional: OpenAI-compatible LLM · Python ML service       │
      └────────────────────────────────────────────────────────────┘
```

**Why two repositories?** `src/lib/data/repository.ts` defines one interface;
`DemoRepository` and `PrismaRepository` both implement it. Swapping
`DATA_SOURCE` never leaks into UI or route code — an evaluator can run the whole
product with no database, and a deployment can switch to PostgreSQL by changing
one environment variable.

**Security:** bcrypt password hashing, `jose`-signed JWT session cookies,
Zod validation on every mutating endpoint, an in-process rate limiter, per-user
authorisation checks inside each handler, admin-only route gating in middleware,
security headers in `next.config.ts`, and no secrets in code — everything comes
from environment variables.

---

## The AI layer

### Matching (`src/lib/ai/match-engine.ts`)

Every score is a weighted sum of six explainable factors, so the UI can always
answer *"Why this match?"* with real numbers instead of a black box:

| Factor               | Weight | Notes                                                    |
| -------------------- | ------ | -------------------------------------------------------- |
| Skill match          | 0.42   | Importance-weighted; a missing **required** skill is a hard penalty, a missing *preferred* one is soft; below-level skills earn 0.6 partial credit |
| Location             | 0.16   | Remote = 0.95; preferred location = 1.0; otherwise distance decay over 25 / 60 / 120 / 250 km |
| Education            | 0.14   | Ordinal comparison; one step below = 0.6                   |
| Experience           | 0.12   | Ordinal comparison; one step below = 0.65                  |
| Preferences          | 0.10   | Job type, work mode, industry, salary expectation          |
| Profile similarity   | 0.06   | TF-IDF cosine between the profile document and the job description |

Final score is clamped to **5–99** — a floor of 5 stops a poor match reading as
"0%", which in testing made users think the app was broken. Weights live in one
place (`MATCH_WEIGHTS`) so a learned model can replace or blend with them.

### Skill gaps (`src/lib/ai/skill-gap.ts`)

Goal-aware, not a naive diff. It first picks *plausible target roles* — jobs
within a score margin of the best match **and** semantically close to the stated
career goal — then weights each missing skill by how much the market actually
demands it, scaled by how on-goal those roles are.

This matters: a naive implementation recommended "Fishery" to a user whose goal
was *"Accounts Assistant"*, because some job somewhere listed it. The current
engine, on Ravi's profile, reports exactly three gaps — **Digital Payments (UPI)**
(2 weeks), **GST** (4 weeks), **Tally Prime** (6 weeks) — all on-goal, with a
coverage score of 91.

### NLP (`src/lib/ai/nlp.ts`)

Dependency-free TF-IDF cosine similarity with corpus IDF, plus keyword
extraction. Used for the semantic factor and to keep the two engines' notion of
"similar" consistent.

---

## The agentic assistant

`/agent` is the headline feature. It is a genuine tool-calling loop, not a
hard-coded chat script.

**Tools** (`src/lib/ai/agent/tools.ts`) — eight, each returning a result
summary that is fed back into the reply:

| Tool                    | Side effect | Purpose                                          |
| ----------------------- | ----------- | ------------------------------------------------ |
| `searchJobs`            | –           | Rank the pool for a free-text or keyword query    |
| `filterJobs`            | –           | Structured filters: distance, job type, salary, work mode |
| `getJobDetails`         | –           | One posting plus its full match breakdown, including *why* |
| `analyzeSkillGap`       | –           | Gaps for the user's goal, or for one target job   |
| `recommendTraining`     | –           | Programmes that close a specific gap              |
| `prepareApplication`    | **yes**     | Drafts an application package for approval        |
| `trackApplication`      | –           | Status of one tracked application                 |
| `getApplicationStatus`  | –           | Summary across all of the user's applications     |

**Planner** (`src/lib/ai/agent/planner.ts`) maps an utterance to an intent and
extracts parameters (₹15,000 → salary expectation; 30 km → distance; "Tally" →
skill). Ten documented intents are covered by tests, including the ambiguity
between *"How do I apply?"* (advice) and *"Apply for this job"* (draft) — the
specific intent must win.

**Approval gate.** `prepareApplication` is the only tool with a side effect, and
it does **not** submit anything. It returns a draft plus an `AgentAction` in
`PENDING_APPROVAL`. Only an explicit `approveActionId` from a click on
**Confirm & Submit** writes an application; `rejectActionId` marks it `REJECTED`.
The reply text always names the job so there is no ambiguity about what was
drafted, and the model prompt forbids ever claiming a submission happened.

**Optional real LLM.** Set `LLM_PROVIDER` + `OPENAI_API_KEY` and the tool results
are phrased by a chat model (`src/lib/ai/llm.ts`, OpenAI-compatible, so Groq /
Together / OpenRouter / local Ollama all work). The planner and tools stay
deterministic — the LLM only writes prose. If the call fails or times out, the
templated reply is used, so a live demo cannot break. `/api/health` reports which
mode is active.

---

## Data model

18 Prisma models in `prisma/schema.prisma`:

```
Location ─┬─< Profile >─┬─< UserSkill >─ Skill
          │             └─< ProfilePreferredLocation
          └─< Job >─────< JobSkill >────── Skill
                 │
                 └─< Application >─< ApplicationEvent
Training ─< TrainingSkill >─ Skill          User ─< UserTraining >─ Training
                                            User ─< SkillGap >─ Skill
User ─< AgentConversation >─< AgentMessage
User ─< AgentAction                        User ─< Notification
```

The TypeScript domain types in `src/types/index.ts` are deliberately decoupled
from the Prisma client, which is what allows the same code to run against the
in-memory dataset.

**Demo dataset:** 43 jobs · 52 skills · 12 locations · 15 training programmes ·
14 user accounts · applications across every status.

---

## API reference

All responses share one envelope: `{ ok: true, data }` or `{ ok: false, error }`.
Errors carry an HTTP status and optional `details` for form field errors.

| Area           | Endpoints                                                                             |
| -------------- | ------------------------------------------------------------------------------------- |
| Auth           | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session` |
| Profile        | `GET /api/profile`, `PUT /api/profile`                                                  |
| Jobs           | `GET /api/jobs`, `GET /api/jobs/[id]`, `GET /api/recommendations`, `POST /api/job-match` |
| Skills         | `GET /api/skill-gaps`, `POST /api/skill-gaps`                                           |
| Training       | `GET /api/training`, `POST /api/training/enroll`                                        |
| Applications   | `GET/POST /api/applications`, `PATCH /api/applications/[id]`                             |
| Agent          | `GET/POST /api/agent/chat`, `POST /api/agent/search-jobs`, `POST /api/agent/analyze-job`  |
| Insights       | `GET /api/insights`                                                                     |
| Admin          | `GET /api/admin/overview`, `POST /api/admin/jobs`, `POST /api/admin/training`            |
| Discovery      | `GET /api/map`, `GET /api/reference`, `GET/PATCH /api/notifications`                     |
| Ops            | `GET /api/health`, `POST /api/ml/match`                                                 |

`GET /api/health` is the quickest smoke test and reports the data source, dataset
size, and whether the ML service and LLM are configured:

```bash
curl -s localhost:3000/api/health
```

---

## Configuration

Everything is optional in demo mode. Copy `.env.example` to `.env.local`.

| Variable          | Default            | Purpose                                              |
| ----------------- | ------------------ | ---------------------------------------------------- |
| `DATA_SOURCE`     | `demo`             | `demo` (in-memory) or `postgres`                     |
| `JWT_SECRET`      | dev placeholder    | **Required in production.** Signs the session cookie  |
| `DATABASE_URL`    | local postgres     | Only when `DATA_SOURCE=postgres`                     |
| `ML_SERVICE_URL`  | unset              | Point at `ml-service/` to use the Python matcher      |
| `LLM_PROVIDER`    | unset              | Enables natural-language replies from a real model    |
| `OPENAI_API_KEY`  | unset              | Key for the above                                    |
| `OPENAI_BASE_URL` | OpenAI             | Any OpenAI-compatible endpoint                       |
| `LLM_MODEL`       | `gpt-4o-mini`      | Model name                                           |

Generate a real secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## PostgreSQL mode

Only needed if you want real persistence.

```bash
cp .env.example .env.local
# set DATA_SOURCE=postgres and DATABASE_URL=postgresql://user:pass@host:5432/gramskill
npm run setup          # prisma generate + db push + seed
npm run db:studio      # inspect the data
```

The seed script (`prisma/seed.ts`) loads the same dataset the demo repository
uses, so every screen looks identical.

---

## Python ML service

Optional. `ml-service/` contains a FastAPI service that offers a learned ranker
(XGBoost / scikit-learn) and an optional sentence-transformers semantic backend
behind the same 5–99 score scale.

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000             # http://localhost:8000/docs
cd ..
# then add ML_SERVICE_URL=http://localhost:8000 to .env.local and restart
```

Use a virtualenv rather than a system-wide install: a global FastAPI/Starlette
pair that other projects have mutated is the single most common reason this
service refuses to start. The npm equivalents (`npm run ml:install`, `ml:dev`,
`ml:train`, `ml:test`) work too and pick up whatever interpreter is active.

Without it, `POST /api/ml/match` transparently falls back to the in-process
TypeScript matcher and always reports which engine produced the score:

```json
{ "engine": "typescript-matcher", "prediction": null, "localMatch": { "score": 86 } }
```

See **[ml-service/README.md](ml-service/README.md)** for the feature list, the
training pipeline, holdout metrics and the degraded-mode matrix. On the training
labels: they are synthetic and the README says so plainly — the *pipeline* is
real, the ground truth is not.

---

## Accessibility & language

Rural-first, which means accessibility is a feature, not a checkbox:

- **Hindi / English** UI switching, and the agent can reply in either.
- **Simple language mode** — short sentences, no jargon, for low digital literacy.
- **Low bandwidth mode** — trims heavy visuals and animation.
- **Large text** and **reduced motion** (auto-detects the OS preference).
- **Voice input** on the agent and search.
- Semantic HTML, labelled controls, `aria-*` on every interactive Radix
  primitive, visible focus rings, keyboard-navigable throughout.
- Mobile-first layout with a **bottom navigation bar** (Home · Jobs · AI Agent ·
  Applications · Profile) under 768 px.

---

## Testing

```bash
npm test          # 18 engine tests
npm run typecheck
npm run build

cd ml-service
python tests/verify_logic.py                     # logic checks, no server needed
python -m pytest -q                              # 12 API contract tests
```

The TypeScript suite covers the parts most likely to silently break a demo:
dataset integrity, the demo password hash, skill overlap with REQUIRED-missing
blockers, score bounds and weight sums, ranking order (accounting > welding),
remote distance handling, `maxDistanceKm`, gap ranking and training mapping,
on-goal gap isolation, explicit `targetJobId`, learning-path projection, no
duplicate programmes, all ten agent intents, planner parameter extraction, and
`prepareApplication` requiring approval.

`tests/test_service.py` in `ml-service/` mirrors these so the two engines cannot
drift apart unnoticed.

---

## Deployment

| Piece      | Target                     | Notes                                                        |
| ---------- | -------------------------- | ------------------------------------------------------------ |
| Frontend   | Render (or Vercel)         | Set `DATA_SOURCE`, `JWT_SECRET`, optionally `DATABASE_URL`      |
| ML service | Render / Railway / Fly     | `render.yaml` wires it automatically; the Dockerfile honours `$PORT` |
| Database   | Neon / Supabase / Render   | `npm run setup` against the production URL                      |

### Deploy to Render

This repository ships a [`render.yaml`](render.yaml) blueprint, so the deploy is
one step: **Render Dashboard → New → Blueprint → connect
`github.com/gouravKJ/Gramskill-AI` → Apply**. Render then creates both services
and fills in every environment variable, including a generated `JWT_SECRET`.

Repository: <https://github.com/gouravKJ/Gramskill-AI>

Two things worth knowing before the first deploy:

**1. `JWT_SECRET` is mandatory in production.** `src/lib/auth/jwt.ts` deliberately
*throws* without a 32+ character secret rather than silently signing sessions
with a development default. The blueprint generates one; if you create the
service by hand instead, set it yourself:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**2. The blueprint deploys in demo mode.** `DATA_SOURCE=demo` uses the bundled
in-memory dataset, so there is no database to provision and the demo is live in
about two minutes. The free tier cold-starts after ~15 minutes idle — the first
request takes a few seconds, everything after that is fast.

Adding the Python ML service is optional. `render.yaml` includes it and links the
two with Render's internal `hostport`, which has no `http://` prefix; the app adds
one (see [`src/lib/server/ml-service.ts`](src/lib/server/ml-service.ts)). If the ML
service is asleep, still building, or OOM-killed on the free 512 MB instance, the
app quietly falls back to its TypeScript matcher — `/api/health` will tell you
which engine is live:

```bash
curl -s https://<your-app>.onrender.com/api/health
```

### Manual deployment (any Node host)

```bash
npm ci                 # installs devDependencies (needed: Tailwind, TypeScript)
npm run build
npm start              # Next.js reads $PORT
```

The build requires devDependencies — `tailwindcss`, `@tailwindcss/postcss`,
`typescript` and `prisma` are all build-time tools. Do not set
`NPM_CONFIG_PRODUCTION=true`, or the CSS and typecheck steps fail.

---

## Project layout

```
src/
├── app/
│   ├── (marketing)/        landing, about, how-it-works, privacy, contact
│   ├── (auth)/             login, register
│   ├── (app)/              authenticated product surfaces
│   └── api/                30+ REST route handlers
├── components/
│   ├── ui/                 Radix + Tailwind primitives (shadcn-style, vendored)
│   ├── landing/            hero, feature grid, timeline, pipeline
│   ├── jobs/               job cards, why-match, filters, apply dialog
│   ├── agent/              chat UI, tool trace, approval card
│   ├── dashboard/          stat cards, charts, greeting
│   ├── applications/       Kanban board
│   ├── admin/  map/  onboarding/  profile/  training/  auth/
│   ├── layout/             app shell, header, nav, user menu, notifications
│   └── shared/             metrics, AI indicators, brand, voice, a11y menu
├── lib/
│   ├── ai/                 match-engine, skill-gap, nlp, llm
│   │   └── agent/          planner, tools, agent loop
│   ├── data/               repository interface, demo dataset, Prisma repo
│   ├── server/             workspace loader, analytics, map data
│   ├── auth/               jwt (edge-safe), session, password
│   └── api/                response envelope, errors, rate limiting
└── types/                  domain types

prisma/                     schema (18 models) + seed
ml-service/                 FastAPI matching service
```

---

## Honest limitations

Listed deliberately — an evaluator will find these anyway, and being upfront is
better than being caught.

1. **The demo dataset is fictional.** Companies, salaries, coordinates and
   people are synthetic placeholders, labelled `(Demo)` throughout. No real-world
   statistics are claimed anywhere in the UI.
2. **The Python ranker's labels are synthetic.** The training pipeline,
   evaluation and serving path are real; the ground truth is generated from a
   documented formula. It does *not* measure real hiring outcomes.
3. **Positions and locations are illustrative.** Coordinates are approximate
   district centres, not surveyed geocodes.
4. **The agent is a deterministic planner with optional LLM polish.** Tool
   selection is rule-based, not model-driven — which is why it never hallucinates
   a job, but also why it will not handle an intent outside the ten it knows.
5. **No employer-side surface.** There is no recruiter or company login; the
   admin role is platform-operational only.
6. **Rate limiting is in-process**, fine for a demo and a single instance, not
   for a multi-region deployment (use Redis there).
7. **Notification delivery is in-app only.** No email or SMS provider is wired.

---

Built as an academic project demonstrating a complete AI product: frontend,
backend, database schema, REST APIs, ML service structure, agentic AI
architecture, authentication, demo data and responsive UI — end to end.
