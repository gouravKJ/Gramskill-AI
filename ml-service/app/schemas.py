"""Wire contract for the matching service.

These models describe exactly what `src/app/api/ml/match/route.ts` posts, using
the same camelCase field names as the TypeScript domain types. Unknown fields are
allowed so the Next.js layer can add context (e.g. `corpusSize`) without a
lock-step release of this service.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UserSkillIn(BaseModel):
    model_config = ConfigDict(extra="allow")

    skillId: str
    proficiency: str = "INTERMEDIATE"
    yearsExperience: float = 0.0


class ProfileIn(BaseModel):
    """Subset of the TS `Profile` used for scoring.

    Defaults are deliberately permissive: a half-filled profile (the normal case
    during onboarding) must still produce a sensible score, not a 422.
    """

    model_config = ConfigDict(extra="allow")

    userId: str = "anonymous"
    name: str = "Job seeker"
    locationId: str = "loc-remote"
    education: str | None = None
    course: str | None = None
    experience: str | None = None
    language: str = "en"
    jobTypes: list[str] = Field(default_factory=list)
    preferredLocationIds: list[str] = Field(default_factory=list)
    salaryExpectation: float | None = None
    workModes: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    careerGoal: str = ""
    bio: str = ""
    resumeText: str = ""
    skills: list[UserSkillIn] = Field(default_factory=list)
    # Set by the proxy route: flat ids plus the richer `<id>/<level>` pairs.
    skillIds: list[Any] = Field(default_factory=list)
    skillIdsWithLevels: list[Any] = Field(default_factory=list)


class JobSkillIn(BaseModel):
    model_config = ConfigDict(extra="allow")

    skillId: str
    importance: str = "PREFERRED"
    minProficiency: str = "BEGINNER"


class JobIn(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = "job-unknown"
    title: str = ""
    company: str = ""
    companyType: str = "Private"
    sector: str = ""
    source: str = "PRIVATE"
    description: str = ""
    requirements: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    locationId: str = "loc-remote"
    workMode: str = "ONSITE"
    jobType: str = "FULL_TIME"
    salaryMin: float | None = None
    salaryMax: float | None = None
    experienceRequired: str = "FRESHER"
    educationRequired: str = "BELOW_10"
    isRuralFriendly: bool = False
    localLanguageSupport: bool = False
    skills: list[JobSkillIn] = Field(default_factory=list)
    # The proxy sets this to the raw `job.skills` array — kept permissive.
    skillIds: list[Any] = Field(default_factory=list)


class MatchRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    profile: ProfileIn
    job: JobIn
    # Optional: the candidate pool the TS engine also scored. Enables corpus-wide
    # IDF for the lexical semantic backend, which improves score comparability.
    corpus: list[JobIn] | None = None


class BatchMatchRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    profile: ProfileIn
    jobs: list[JobIn]
    topK: int | None = None


class FactorOut(BaseModel):
    key: str
    label: str
    score: float          # normalised 0..1
    weight: float         # share of the final score
    contribution: float   # score * weight
    detail: str


class MatchPrediction(BaseModel):
    engine: str
    modelVersion: str
    modelKind: str            # "heuristic" | "gradient-boosting"
    semanticBackend: str      # "embeddings" | "lexical"
    matchScore: int           # 5..99, same scale as the TypeScript engine
    probability: float        # raw 0..1 output of the ACTIVE model
    # What the linear weighted-factor formula would have said. Kept separate so
    # `factors` always reconstructs it exactly, while `probability` shows the
    # learned model's refinement. They are equal when the heuristic is active.
    baselineProbability: float
    confidence: str           # high | medium | low
    factors: list[FactorOut]
    matchedSkills: list[str]
    partialSkills: list[str]
    missingSkills: list[str]
    requiredMissing: list[str]
    matchedSkillIds: list[str]
    missingSkillIds: list[str]
    requiredSkillCoverage: float
    distanceKm: float | None
    explanations: list[str]
    warnings: list[str]
    latencyMs: float


class BatchMatchResponse(BaseModel):
    engine: str
    modelVersion: str
    modelKind: str
    results: list[MatchPrediction]


class HealthResponse(BaseModel):
    status: str
    service: str
    modelVersion: str
    engine: str
    modelKind: str
    semanticBackend: str
    capabilities: dict[str, bool]
    skillCatalogueSize: int
    locationCatalogueSize: int


class ModelInfoResponse(BaseModel):
    modelVersion: str
    engine: str
    modelKind: str
    rankerAvailable: bool
    semanticBackend: str
    featureNames: list[str]
    factorWeights: dict[str, float]
    notes: list[str]
