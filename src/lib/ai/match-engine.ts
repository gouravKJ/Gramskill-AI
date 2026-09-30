import {
  EDUCATION_ORDER,
  EXPERIENCE_ORDER,
  PROFICIENCY_ORDER,
  SKILL_BY_ID,
  locationById,
} from "@/lib/data/catalogue";
import { jobDocument, profileDocument, semanticSimilarity } from "@/lib/ai/nlp";
import { distanceKm } from "@/lib/utils";
import type {
  Job,
  JobMatch,
  MatchExplanation,
  MatchFactor,
  Profile,
  UserSkill,
} from "@/types";

/**
 * Deterministic, explainable job matching engine.
 *
 * Design notes
 * ------------
 * 1. Every score is decomposed into weighted factors, so the UI can always
 *    answer "Why this match?" with real numbers instead of a black box.
 * 2. Weights live in one place (`MATCH_WEIGHTS`) so a future XGBoost model can
 *    replace or blend with them without touching UI code.
 * 3. Skill-overlap, education and experience rules mirror how rural
 *    recruitment actually works (a missing *required* skill is a hard penalty,
 *    a missing *preferred* skill is a soft one).
 */

export const MATCH_WEIGHTS: Record<MatchFactor["key"], number> = {
  skills: 0.42,
  education: 0.14,
  experience: 0.12,
  location: 0.16,
  preferences: 0.1,
  semantic: 0.06,
};

const IMPORTANCE_WEIGHT: Record<string, number> = {
  REQUIRED: 1,
  PREFERRED: 0.55,
  OPTIONAL: 0.25,
};

export interface SkillOverlap {
  matched: string[];
  partial: string[];
  missing: string[];
  ratio: number;
  requiredMissing: string[];
}

/** Compute weighted skill overlap between a user and a job. */
export function skillOverlap(profileSkills: UserSkill[], job: Job): SkillOverlap {
  const userMap = new Map(profileSkills.map((s) => [s.skillId, s]));
  const matched: string[] = [];
  const partial: string[] = [];
  const missing: string[] = [];
  const requiredMissing: string[] = [];

  let earned = 0;
  let possible = 0;

  for (const requirement of job.skills) {
    const weight = IMPORTANCE_WEIGHT[requirement.importance] ?? 0.5;
    possible += weight;
    const userSkill = userMap.get(requirement.skillId);

    if (!userSkill) {
      missing.push(requirement.skillId);
      if (requirement.importance === "REQUIRED") requiredMissing.push(requirement.skillId);
      continue;
    }

    const userLevel = PROFICIENCY_ORDER[userSkill.proficiency] ?? 1;
    const neededLevel = PROFICIENCY_ORDER[requirement.minProficiency] ?? 1;

    if (userLevel >= neededLevel) {
      earned += weight;
      matched.push(requirement.skillId);
    } else {
      // Partial credit — the user has the skill but below the expected level.
      earned += weight * 0.6;
      partial.push(requirement.skillId);
    }
  }

  const ratio = possible > 0 ? earned / possible : 0.5;
  return { matched, partial, missing, ratio, requiredMissing };
}

function educationScore(profile: Profile, job: Job) {
  if (!profile.education) return { score: 0.6, detail: "Education not added to your profile yet." };
  const user = EDUCATION_ORDER[profile.education] ?? 0;
  const needed = EDUCATION_ORDER[job.educationRequired] ?? 0;
  if (user >= needed) {
    return { score: 1, detail: "Your education meets or exceeds the requirement." };
  }
  const gap = needed - user;
  return {
    score: gap === 1 ? 0.6 : 0.3,
    detail:
      gap === 1
        ? "Your qualification is one step below the stated requirement."
        : "Your qualification is below the stated requirement.",
  };
}

function experienceScore(profile: Profile, job: Job) {
  if (!profile.experience) return { score: 0.6, detail: "Experience not added to your profile yet." };
  const user = EXPERIENCE_ORDER[profile.experience] ?? 0;
  const needed = EXPERIENCE_ORDER[job.experienceRequired] ?? 0;
  if (user >= needed) return { score: 1, detail: "Your experience level matches this role." };
  const gap = needed - user;
  return {
    score: gap === 1 ? 0.65 : 0.35,
    detail:
      gap === 1
        ? "This role expects slightly more experience than you have."
        : "This role expects considerably more experience than you have.",
  };
}

function locationScore(profile: Profile, job: Job, homeLocationId: string) {
  const home = locationById(homeLocationId);
  const jobLocation = locationById(job.locationId);

  if (job.workMode === "REMOTE") {
    return { score: 0.95, distance: null as number | null, detail: "Remote role — you can work from your village." };
  }

  const km = distanceKm(home, jobLocation);
  const explicitlyPreferred = profile.preferredLocationIds.includes(job.locationId);
  if (explicitlyPreferred) {
    return { score: 1, distance: km, detail: "This location is one of your preferred work locations." };
  }

  // Distance decay: full score within 25 km, then falling off toward 250 km.
  let score: number;
  if (km <= 25) score = 1;
  else if (km <= 60) score = 0.85;
  else if (km <= 120) score = 0.65;
  else if (km <= 250) score = 0.4;
  else score = 0.2;
  if (job.workMode === "HYBRID") score = Math.min(1, score + 0.05);

  return {
    score,
    distance: km,
    detail:
      km <= 60
        ? `Only about ${km} km from your location — a manageable daily commute.`
        : `About ${km} km from your location; relocation or hybrid arrangement needed.`,
  };
}

function preferenceScore(profile: Profile, job: Job) {
  const checks: { hit: boolean; label: string }[] = [];

  if (profile.jobTypes.length) {
    checks.push({ hit: profile.jobTypes.includes(job.jobType), label: `job type (${labelEnum(job.jobType)})` });
  }
  if (profile.workModes.length) {
    checks.push({ hit: profile.workModes.includes(job.workMode), label: `work mode (${labelEnum(job.workMode)})` });
  }
  if (profile.industries.length) {
    checks.push({ hit: profile.industries.includes(job.sector), label: `industry (${job.sector})` });
  }
  if (profile.salaryExpectation && (job.salaryMax ?? job.salaryMin)) {
    const offered = job.salaryMax ?? job.salaryMin ?? 0;
    checks.push({
      hit: offered >= profile.salaryExpectation,
      label: `salary expectation (₹${profile.salaryExpectation.toLocaleString("en-IN")})`,
    });
  }

  if (!checks.length) {
    return { score: 0.7, detail: "Add job preferences to sharpen your matches." };
  }

  const hits = checks.filter((c) => c.hit);
  const score = hits.length / checks.length;
  return {
    score,
    detail:
      hits.length === checks.length
        ? "This role matches all of your stated preferences."
        : `Matches ${hits.length} of ${checks.length} preferences — check ${checks
            .filter((c) => !c.hit)
            .map((c) => c.label)
            .join(", ")}.`,
  };
}

function labelEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .join(" ");
}

export interface MatchOptions {
  /** Restrict scoring to a candidate pool (used by filters/agent tools). */
  jobs?: Job[];
  /** Corpus for IDF when computing semantic similarity. */
  corpus?: Job[];
  /** Force a comparison location different from the profile location. */
  originLocationId?: string;
  /** Cut-off distance in km; jobs beyond are dropped. */
  maxDistanceKm?: number;
}

export function matchJob(
  profile: Profile,
  job: Job,
  options: Omit<MatchOptions, "jobs"> = {},
): JobMatch {
  const overlap = skillOverlap(profile.skills, job);
  const home = options.originLocationId ?? profile.locationId;
  const edu = educationScore(profile, job);
  const exp = experienceScore(profile, job);
  const loc = locationScore(profile, job, home);
  const prefs = preferenceScore(profile, job);

  const corpus = (options.corpus ?? []).map((j) =>
    jobDocument({ ...j, skills: j.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId) }),
  );
  const semantic = semanticSimilarity(
    profileDocument({
      careerGoal: profile.careerGoal,
      bio: profile.bio,
      course: profile.course,
      skills: profile.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId),
      industries: profile.industries,
      resumeText: profile.resumeText,
    }),
    jobDocument({ ...job, skills: job.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId) }),
    corpus,
  );

  const factors: MatchFactor[] = [
    {
      key: "skills",
      label: "Skill match",
      score: overlap.ratio,
      weight: MATCH_WEIGHTS.skills,
      detail: `You already have ${overlap.matched.length} of ${job.skills.length} listed skills.`,
    },
    {
      key: "education",
      label: "Education",
      score: edu.score,
      weight: MATCH_WEIGHTS.education,
      detail: edu.detail,
    },
    {
      key: "experience",
      label: "Experience",
      score: exp.score,
      weight: MATCH_WEIGHTS.experience,
      detail: exp.detail,
    },
    {
      key: "location",
      label: "Location",
      score: loc.score,
      weight: MATCH_WEIGHTS.location,
      detail: loc.detail,
    },
    {
      key: "preferences",
      label: "Preferences",
      score: prefs.score,
      weight: MATCH_WEIGHTS.preferences,
      detail: prefs.detail,
    },
    {
      key: "semantic",
      label: "Profile similarity",
      score: semantic,
      weight: MATCH_WEIGHTS.semantic,
      detail: "How closely the job description reads like your career goal and experience.",
    },
  ];

  const raw = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const score = Math.max(5, Math.min(99, Math.round(raw * 100)));

  const matchedNames = [...overlap.matched, ...overlap.partial].map((id) => SKILL_BY_ID.get(id)?.name ?? id);
  const missingNames = overlap.missing.map((id) => SKILL_BY_ID.get(id)?.name ?? id);

  return {
    job,
    score,
    factors,
    matchedSkills: overlap.matched.map((id) => SKILL_BY_ID.get(id)?.name ?? id),
    partialSkills: overlap.partial.map((id) => SKILL_BY_ID.get(id)?.name ?? id),
    missingSkills: missingNames,
    distanceKm: loc.distance,
    explanation: buildExplanation(profile, job, {
      matchedNames,
      missingNames,
      requiredMissing: overlap.requiredMissing,
      locDetail: loc.detail,
      eduDetail: edu.detail,
      expDetail: exp.detail,
    }),
  };
}

function buildExplanation(
  profile: Profile,
  job: Job,
  ctx: {
    matchedNames: string[];
    missingNames: string[];
    requiredMissing: string[];
    locDetail: string;
    eduDetail: string;
    expDetail: string;
  },
): MatchExplanation {
  const reasons: string[] = [];
  if (ctx.matchedNames.length) {
    reasons.push(`Your ${ctx.matchedNames.slice(0, 4).join(", ")} skills are used in this role.`);
  }
  reasons.push(ctx.locDetail);
  if (ctx.eduDetail.includes("meets")) reasons.push(ctx.eduDetail);
  if (ctx.expDetail.includes("matches")) reasons.push(ctx.expDetail);
  if (job.isRuralFriendly) reasons.push("This employer explicitly hires candidates from rural areas.");
  if (job.localLanguageSupport) reasons.push("The workplace supports local-language communication.");

  const gaps = ctx.missingNames.length
    ? [`Missing skill${ctx.missingNames.length > 1 ? "s" : ""}: ${ctx.missingNames.join(", ")}`]
    : [];
  if (ctx.requiredMissing.length) {
    gaps.push(
      `${ctx.requiredMissing.length} of these are mandatory for the role, so training will noticeably improve your chances.`,
    );
  }
  if (!ctx.expDetail.includes("matches")) gaps.push(ctx.expDetail);

  const suggestions: string[] = [];
  if (ctx.missingNames.includes("Tally Prime")) suggestions.push("Start the Tally Prime learning path (6 weeks).");
  if (ctx.missingNames.includes("GST")) suggestions.push("Take GST Filing Basics (4 weeks) to become invoice-ready.");
  if (ctx.missingNames.length && !suggestions.length) {
    suggestions.push(`Look for short training on ${ctx.missingNames[0]}.`);
  }
  if (!profile.salaryExpectation) suggestions.push("Add your salary expectation to improve ranking accuracy.");
  if (suggestions.length === 0) suggestions.push("Your profile is a strong fit — apply with an AI-prepared application.");

  const summary =
    ctx.missingNames.length === 0
      ? `Strong match: you cover every skill listed for ${job.title}.`
      : `Good match: ${ctx.matchedNames.length} skills align, and closing ${ctx.missingNames.length} skill gap${
          ctx.missingNames.length > 1 ? "s" : ""
        } would push your score higher.`;

  const simple =
    `This job needs ${job.title}. ` +
    `You already know ${ctx.matchedNames.slice(0, 3).join(", ") || "some of it"}. ` +
    (ctx.missingNames.length
      ? `You still need to learn ${ctx.missingNames.join(", ")}. `
      : "You already know everything they asked for. ") +
    (job.workMode === "REMOTE"
      ? "You can do this job from home."
      : `This job is near ${locationById(job.locationId).name}.`);

  return { summary, reasons, gaps, suggestions, simple };
}

export function matchJobs(profile: Profile, options: MatchOptions = {}): JobMatch[] {
  const pool = options.jobs ?? [];
  const matches = pool
    .map((job) => matchJob(profile, job, { corpus: options.corpus ?? pool, originLocationId: options.originLocationId }))
    .filter((m) =>
      options.maxDistanceKm == null || m.distanceKm == null
        ? true
        : m.distanceKm <= options.maxDistanceKm,
    );
  return matches.sort((a, b) => b.score - a.score || a.job.id.localeCompare(b.job.id));
}

/** Aggregate match quality used by the dashboard "AI Match Score" card. */
export function overallMatchScore(matches: JobMatch[]): number {
  const top = matches.slice(0, 5);
  if (!top.length) return 0;
  const weighted = top.reduce((sum, m, i) => sum + m.score * (top.length - i), 0);
  const weightSum = top.reduce((sum, _, i) => sum + (top.length - i), 0);
  return Math.round(weighted / weightSum);
}
