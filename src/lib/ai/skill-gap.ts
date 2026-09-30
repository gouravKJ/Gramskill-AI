import { EXPERIENCE_ORDER, SKILL_BY_ID } from "@/lib/data/catalogue";
import { matchJob } from "@/lib/ai/match-engine";
import { jobDocument, profileDocument, semanticSimilarity } from "@/lib/ai/nlp";
import type { Job, JobMatch, Profile, SkillGap, SkillImportance, Training } from "@/types";

/**
 * Skill-gap engine.
 *
 * Given a profile and a job pool, produce the ranked list of missing skills with
 * an importance weight, an estimated learning duration and the programmes that
 * close them. Durations come from the skill catalogue so the gap page, the
 * training page and the agent never disagree.
 *
 * Two-stage design (this matters for output quality):
 *   1. Select *plausible target roles* — high match score **and** meaningfully
 *      similar to the user's stated career goal. Without the second condition a
 *      candidate who wants bookkeeping work gets told to learn fishery, purely
 *      because a nearby fishery posting matched on location.
 *   2. Aggregate skill demand across those roles, weighting each skill by the
 *      relevance of the role that asks for it.
 */

export interface SkillGapDetail extends SkillGap {
  skillName: string;
  category: string;
  learningWeeks: number;
  /** Jobs in the current pool that require this skill. */
  demandedBy: { jobId: string; title: string; importance: string }[];
  recommendedTraining: Training[];
}

export interface SkillGapReport {
  targetJob: Job | null;
  /** The roles the report was actually computed against. */
  targetMatches: JobMatch[];
  currentSkills: { skillId: string; name: string; proficiency: string; category: string }[];
  requiredSkills: { skillId: string; name: string; importance: string; category: string }[];
  gaps: SkillGapDetail[];
  coverage: number;
  /** Weeks of part-time study to close the top three gaps. */
  estimatedWeeksToClose: number;
}

export interface AnalyzeOptions {
  /** Jobs to analyse against. */
  jobs: Job[];
  training: Training[];
  /** Explicit target job (used when the user opens a job page or learning path). */
  targetJobId?: string;
  limit?: number;
}

/** Minimum semantic similarity (relative to the best role) to be a target role. */
const GOAL_FIT_FLOOR = 0.4;
/** How far below the best match score a role may sit and still count. */
const SCORE_MARGIN = 15;

function skillNames(job: Job) {
  return job.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId);
}

function toDocument(profile: Profile) {
  return profileDocument({
    careerGoal: profile.careerGoal,
    bio: profile.bio,
    course: profile.course,
    skills: profile.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId),
    industries: profile.industries,
  });
}

export function analyzeSkillGaps(profile: Profile, options: AnalyzeOptions): SkillGapReport {
  const { jobs, training } = options;
  const limit = options.limit ?? 8;

  const explicitTarget = options.targetJobId
    ? (jobs.find((j) => j.id === options.targetJobId) ?? null)
    : null;

  const ranked = jobs
    .map((job) => matchJob(profile, job, { corpus: jobs }))
    .sort((a, b) => b.score - a.score);

  const goalDoc = toDocument(profile);
  const jobDocs = new Map(
    jobs.map((job) => [
      job.id,
      jobDocument({
        ...job,
        title: job.title,
        sector: job.sector,
        description: job.description,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        skills: skillNames(job),
      }),
    ]),
  );

  const goalFit = (job: Job) =>
    semanticSimilarity(goalDoc, jobDocs.get(job.id) ?? "", [...jobDocs.values()]);

  /* -------------------- stage 1: plausible target roles ------------------ */
  let targetMatches: JobMatch[];
  if (explicitTarget) {
    targetMatches = ranked.filter((m) => m.job.id === explicitTarget.id).slice(0, 1);
  } else {
    const topScore = ranked[0]?.score ?? 0;
    const candidates = ranked.filter((m) => m.score >= Math.max(50, topScore - SCORE_MARGIN));
    const fits = candidates.map((match) => ({ match, fit: goalFit(match.job) }));
    const bestFit = Math.max(...fits.map((f) => f.fit), 0.001);
    targetMatches = fits
      .filter((entry) => entry.fit >= bestFit * GOAL_FIT_FLOOR)
      .sort((a, b) => b.match.score - a.match.score || b.fit - a.fit)
      .slice(0, 5)
      .map((entry) => entry.match);

    if (!targetMatches.length) targetMatches = ranked.slice(0, 1);
  }

  const targetJob = explicitTarget ?? targetMatches[0]?.job ?? null;
  const relevantJobs = targetMatches.map((m) => m.job);

  /* -------------------------- stage 2: demand map ------------------------ */
  // Relevance blends match strength with goal similarity, so a strong-but-
  // off-goal posting never dominates the learning plan.
  const relevance = new Map<string, number>();
  let bestRelevance = 0;
  for (const match of targetMatches) {
    const job = match.job;
    if (explicitTarget) {
      relevance.set(job.id, 1);
      bestRelevance = 1;
      continue;
    }
    const value = (match.score / 100) * (0.45 + 0.55 * goalFit(job));
    relevance.set(job.id, value);
    bestRelevance = Math.max(bestRelevance, value);
  }

  interface DemandEntry {
    score: number;
    importance: SkillImportance;
    topRelevance: number;
    jobs: { jobId: string; title: string; importance: string }[];
  }

  const demand = new Map<string, DemandEntry>();

  for (const job of relevantJobs) {
    const jobRelevance = relevance.get(job.id) ?? 0;
    for (const requirement of job.skills) {
      const importanceWeight =
        requirement.importance === "REQUIRED" ? 1 : requirement.importance === "PREFERRED" ? 0.5 : 0.2;

      const entry: DemandEntry =
        demand.get(requirement.skillId) ??
        { score: 0, importance: "OPTIONAL", topRelevance: -1, jobs: [] };

      entry.score += jobRelevance * importanceWeight;
      entry.jobs.push({ jobId: job.id, title: job.title, importance: requirement.importance });

      // Importance is inherited from the most relevant job asking for the skill,
      // not the strictest one — a mandatory skill on an off-goal posting should
      // not read as a blocker.
      if (jobRelevance >= entry.topRelevance) {
        entry.topRelevance = jobRelevance;
        entry.importance = requirement.importance;
      }

      demand.set(requirement.skillId, entry);
    }
  }

  // Discard signals that only appear on marginal roles.
  const demandFloor = bestRelevance * 0.2;
  for (const [skillId, entry] of demand) {
    if (entry.score < demandFloor) demand.delete(skillId);
  }

  /* ------------------------------ gaps ---------------------------------- */
  const userSkillIds = new Set(profile.skills.map((s) => s.skillId));

  const gaps: SkillGapDetail[] = [...demand.entries()]
    .filter(([skillId]) => !userSkillIds.has(skillId))
    .map(([skillId, entry]) => {
      const skill = SKILL_BY_ID.get(skillId);
      const weeks = skill?.learningWeeks ?? 4;
      return {
        id: `gap-${profile.userId}-${skillId}`,
        userId: profile.userId,
        skillId,
        targetJobId: targetJob?.id ?? null,
        importance: entry.importance,
        estimatedWeeks: weeks,
        rationale: buildRationale(skillId, entry.jobs.length, entry.importance),
        detectedAt: new Date().toISOString(),
        skillName: skill?.name ?? skillId,
        category: skill?.category ?? "General",
        learningWeeks: weeks,
        demandedBy: entry.jobs,
        recommendedTraining: training
          .filter((programme) => programme.skillIds.includes(skillId))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3),
      };
    })
    .sort((a, b) => {
      const importanceRank = (value: string) => (value === "REQUIRED" ? 2 : value === "PREFERRED" ? 1 : 0);
      return (
        importanceRank(b.importance) - importanceRank(a.importance) ||
        b.demandedBy.length - a.demandedBy.length ||
        a.learningWeeks - b.learningWeeks
      );
    })
    .slice(0, limit);

  /* ----------------------------- coverage -------------------------------- */
  let requiredSlots = 0;
  let satisfiedSlots = 0;
  for (const job of relevantJobs) {
    for (const requirement of job.skills) {
      if (requirement.importance !== "REQUIRED") continue;
      requiredSlots += 1;
      if (userSkillIds.has(requirement.skillId)) satisfiedSlots += 1;
    }
  }

  const userSkillMap = new Map(profile.skills.map((s) => [s.skillId, s]));
  const currentSkills = profile.skills
    .map((s) => SKILL_BY_ID.get(s.skillId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      skillId: s.id,
      name: s.name,
      proficiency: userSkillMap.get(s.id)?.proficiency ?? "BEGINNER",
      category: s.category,
    }));

  const requiredSkills = [...demand.entries()]
    .map(([skillId, entry]) => {
      const skill = SKILL_BY_ID.get(skillId);
      return {
        skillId,
        name: skill?.name ?? skillId,
        importance: entry.importance as string,
        category: skill?.category ?? "General",
      };
    })
    .sort((a, b) => {
      const order = (value: string) => (value === "REQUIRED" ? 0 : value === "PREFERRED" ? 1 : 2);
      return order(a.importance) - order(b.importance) || a.name.localeCompare(b.name);
    });

  return {
    targetJob,
    targetMatches,
    currentSkills,
    requiredSkills,
    gaps,
    coverage: requiredSlots ? Math.round((satisfiedSlots / requiredSlots) * 100) : 100,
    estimatedWeeksToClose: gaps.slice(0, 3).reduce((sum, gap) => sum + gap.estimatedWeeks, 0),
  };
}

function buildRationale(skillId: string, jobCount: number, importance: string): string {
  const name = SKILL_BY_ID.get(skillId)?.name ?? skillId;
  const roles = `${jobCount} of your target roles`;
  if (importance === "REQUIRED") {
    return `${name} is a mandatory requirement in ${roles}, so employers will screen for it first.`;
  }
  if (importance === "PREFERRED") {
    return `${name} is preferred (not mandatory) in ${roles} — it improves your ranking against other applicants.`;
  }
  return `${name} appears as a bonus skill in ${roles}.`;
}

/* -------------------------------------------------------------------------- */
/*                          Training / learning paths                         */
/* -------------------------------------------------------------------------- */

export interface LearningPathStep {
  order: number;
  training: Training;
  /** Why the step is ordered here — shown in the UI as a short note. */
  reason: string;
  coversGaps: string[];
  weeks: number;
}

export interface LearningPath {
  careerGoal: string;
  targetJob: Job | null;
  steps: LearningPathStep[];
  totalWeeks: number;
  progress: number;
  /** Estimated match score once every gap in this path is closed. */
  projectedMatchScore: number;
}

/**
 * Build an ordered learning path: mandatory gaps first, quick wins within each
 * tier, finishing with an employability step so new skills convert into offers.
 */
export function buildLearningPath(
  profile: Profile,
  report: SkillGapReport,
  training: Training[],
  targetJob?: Job | null,
): LearningPath {
  const job = targetJob ?? report.targetJob ?? report.targetMatches[0]?.job ?? null;
  const steps: LearningPathStep[] = [];
  const used = new Set<string>();

  const orderedGaps = [...report.gaps].sort((a, b) => {
    const importanceRank = (value: string) => (value === "REQUIRED" ? 2 : value === "PREFERRED" ? 1 : 0);
    if (importanceRank(b.importance) !== importanceRank(a.importance)) {
      return importanceRank(b.importance) - importanceRank(a.importance);
    }
    return a.learningWeeks - b.learningWeeks; // quick wins first within a tier
  });

  for (const gap of orderedGaps) {
    const candidate =
      gap.recommendedTraining.find((programme) => !used.has(programme.id)) ??
      training.find((programme) => programme.skillIds.includes(gap.skillId) && !used.has(programme.id));
    if (!candidate) continue;
    used.add(candidate.id);
    steps.push({
      order: steps.length + 1,
      training: candidate,
      reason:
        gap.importance === "REQUIRED"
          ? `Mandatory for ${job?.title ?? "your target role"} — highest priority.`
          : `Preferred by employers for ${job?.title ?? "your target roles"}; adds ranking strength.`,
      coversGaps: candidate.skillIds
        .filter((id) => report.gaps.some((gapEntry) => gapEntry.skillId === id))
        .map((id) => SKILL_BY_ID.get(id)?.name ?? id),
      weeks: candidate.durationWeeks,
    });
  }

  // Finish with an employability step if it is not already covered.
  const employability = training.find((programme) => programme.id === "trn-spoken-english");
  if (employability && !used.has(employability.id) && steps.length) {
    used.add(employability.id);
    steps.push({
      order: steps.length + 1,
      training: employability,
      reason: "Interview readiness — converts new skills into an offer.",
      coversGaps: [],
      weeks: employability.durationWeeks,
    });
  }

  const totalWeeks = steps.reduce((sum, step) => sum + step.weeks, 0);
  const covered = steps.reduce((sum, step) => sum + step.coversGaps.length, 0);

  // Projection: closing mandatory gaps lifts the score most, preferred less so.
  const uplift = report.gaps.reduce(
    (sum, gap) => sum + (gap.importance === "REQUIRED" ? 4 : gap.importance === "PREFERRED" ? 2 : 1),
    0,
  );
  const base = job ? matchJob(profile, job, { corpus: [job] }).score : 60;
  const projectedMatchScore = Math.max(base, Math.min(98, base + Math.min(uplift, 14)));
  void covered;

  // `progress` here describes *structure* completion (does every gap have a
  // course?), not learning progress. Actual progress comes from UserTraining
  // records, which the dashboard and training pages read directly.
  const progress = report.gaps.length
    ? Math.round((steps.reduce((sum, step) => sum + step.coversGaps.length, 0) / report.gaps.length) * 100)
    : 100;

  const experience = profile.experience ?? "FRESHER";
  const alreadyExperienced = EXPERIENCE_ORDER[experience] >= EXPERIENCE_ORDER.ONE_TO_THREE;

  return {
    careerGoal: profile.careerGoal || job?.title || "Build employable skills",
    targetJob: job,
    steps,
    totalWeeks: alreadyExperienced ? Math.round(totalWeeks * 0.8) : totalWeeks,
    progress,
    projectedMatchScore,
  };
}
