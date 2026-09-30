import { SKILL_BY_ID, locationById } from "@/lib/data/catalogue";
import { filterJobs } from "@/lib/data/job-query";
import { matchJob, matchJobs } from "@/lib/ai/match-engine";
import { analyzeSkillGaps, buildLearningPath } from "@/lib/ai/skill-gap";
import { formatINR, formatSalaryRange, percent } from "@/lib/utils";
import type {
  AgentToolName,
  Application,
  ApplicationStatus,
  Job,
  JobMatch,
  Profile,
  Training,
} from "@/types";

/**
 * Agent tools.
 *
 * Each tool is a plain async function with an explicit input/output contract —
 * the same shape an LLM tool-calling loop expects (`name`, `description`,
 * `parameters`, `execute`). The demo planner calls them directly; a real LLM
 * only has to pick a name and provide arguments, which is why no tool needs to
 * know anything about prompting.
 */

export interface AgentToolContext {
  profile: Profile;
  jobs: Job[];
  training: Training[];
  applications: Application[];
}

export interface ToolResult {
  summary: string;
  data?: unknown;
  jobIds?: string[];
  matches?: JobMatch[];
  /** Tools that mutate or submit something must be approved by the user. */
  requiresApproval?: boolean;
  pendingDetails?: Record<string, unknown>;
}

export interface AgentTool {
  name: AgentToolName;
  label: string;
  description: string;
  parameters: Record<string, string>;
  /** Set for tools that need explicit human approval before executing. */
  sideEffect?: boolean;
  execute: (ctx: AgentToolContext, input: Record<string, unknown>) => Promise<ToolResult>;
}

function rank(ctx: AgentToolContext, jobs: Job[]): JobMatch[] {
  return matchJobs(ctx.profile, { jobs, corpus: ctx.jobs });
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/* -------------------------------------------------------------------------- */
/*                                 tools                                      */
/* -------------------------------------------------------------------------- */

export const searchJobsTool: AgentTool = {
  name: "searchJobs",
  label: "Search jobs",
  description: "Free-text search across job title, employer, sector and description.",
  parameters: { query: "string", maxDistanceKm: "number?" },
  async execute(ctx, input) {
    const query = String(input.query ?? "");
    const maxDistanceKm = asNumber(input.maxDistanceKm);
    const filtered = filterJobs(ctx.jobs, { query, maxDistanceKm }, ctx.profile.locationId);
    const matches = rank(ctx, filtered).slice(0, 8);
    return {
      summary: matches.length
        ? `Found ${matches.length} job${matches.length > 1 ? "s" : ""} matching "${query}".`
        : `No jobs matched "${query}" in the demo dataset.`,
      jobIds: matches.map((m) => m.job.id),
      matches,
    };
  },
};

export const filterJobsTool: AgentTool = {
  name: "filterJobs",
  label: "Filter jobs",
  description:
    "Filter the job pool by distance, minimum salary, job type, work mode, location or skill.",
  parameters: {
    maxDistanceKm: "number?",
    minSalary: "number?",
    skills: "string[]?",
    jobTypes: "string[]?",
    workModes: "string[]?",
    sources: "string[]?",
    remoteOnly: "boolean?",
  },
  async execute(ctx, input) {
    const maxDistanceKm = asNumber(input.maxDistanceKm);
    const minSalary = asNumber(input.minSalary);
    const skills = asStringArray(input.skills);
    const remoteOnly = input.remoteOnly === true;

    const filtered = filterJobs(
      ctx.jobs,
      {
        skills,
        minSalary,
        maxDistanceKm,
        jobTypes: asStringArray(input.jobTypes) as Job["jobType"][],
        workModes: remoteOnly
          ? ["REMOTE"]
          : (asStringArray(input.workModes) as Job["workMode"][]),
        sources: asStringArray(input.sources) as Job["source"][],
      },
      ctx.profile.locationId,
    );

    const matches = rank(ctx, filtered).slice(0, 8);
    const applied: string[] = [];
    if (maxDistanceKm) applied.push(`within ${maxDistanceKm} km`);
    if (minSalary) applied.push(`paying ${formatINR(minSalary)}+`);
    if (remoteOnly) applied.push("remote");
    if (skills.length) applied.push(`using ${skills.map((s) => SKILL_BY_ID.get(s)?.name ?? s).join(", ")}`);

    return {
      summary: matches.length
        ? `Found ${matches.length} opportunit${matches.length > 1 ? "ies" : "y"}${
            applied.length ? ` ${applied.join(" and ")}` : ""
          }.`
        : `No jobs found ${applied.join(" and ") || "with those filters"}.`,
      jobIds: matches.map((m) => m.job.id),
      matches,
    };
  },
};

export const getJobDetailsTool: AgentTool = {
  name: "getJobDetails",
  label: "Get job details",
  description: "Return the full description, requirements and match explanation for one job.",
  parameters: { jobId: "string" },
  async execute(ctx, input) {
    const jobId = String(input.jobId ?? "");
    const job = ctx.jobs.find((j) => j.id === jobId);
    if (!job) return { summary: "I could not find that job in the demo dataset." };
    const match = matchJob(ctx.profile, job, { corpus: ctx.jobs });
    return {
      summary: `${job.title} at ${job.company} — ${formatSalaryRange(job.salaryMin, job.salaryMax)}/month, ${locationById(
        job.locationId,
      ).name}. Your match score is ${match.score}%.`,
      jobIds: [job.id],
      matches: [match],
      data: { job, match },
    };
  },
};

export const analyzeSkillGapTool: AgentTool = {
  name: "analyzeSkillGap",
  label: "Analyse skill gap",
  description: "Compare the profile against top-matching jobs and list the missing skills.",
  parameters: { targetJobId: "string?" },
  async execute(ctx, input) {
    const report = analyzeSkillGaps(ctx.profile, {
      jobs: ctx.jobs,
      training: ctx.training,
      targetJobId: typeof input.targetJobId === "string" ? input.targetJobId : undefined,
    });
    const names = report.gaps.map((g) => g.skillName);
    return {
      summary: names.length
        ? `You are missing ${names.length} skill${names.length > 1 ? "s" : ""}: ${names.join(", ")}. Your coverage of required skills is ${report.coverage}%.`
        : "You already cover every required skill in your top matches.",
      data: report,
    };
  },
};

export const recommendTrainingTool: AgentTool = {
  name: "recommendTraining",
  label: "Recommend training",
  description: "Build an ordered learning path that closes the detected skill gaps.",
  parameters: { targetJobId: "string?", skill: "string?" },
  async execute(ctx, input) {
    const targetJobId = typeof input.targetJobId === "string" ? input.targetJobId : undefined;
    let training = ctx.training;
    const skillQuery = typeof input.skill === "string" ? input.skill.toLowerCase() : undefined;

    if (skillQuery) {
      const skillIds = ctx.training
        .flatMap((t) => t.skillIds)
        .filter((id) => (SKILL_BY_ID.get(id)?.name ?? "").toLowerCase().includes(skillQuery));
      const matching = ctx.training.filter((t) =>
        t.skillIds.some((id) => skillIds.includes(id)),
      );
      if (matching.length) training = matching;
    }

    const report = analyzeSkillGaps(ctx.profile, {
      jobs: ctx.jobs,
      training: ctx.training,
      targetJobId,
    });
    const path = buildLearningPath(ctx.profile, report, training, report.targetJob ?? undefined);

    return {
      summary: path.steps.length
        ? `I prepared a ${path.steps.length}-step learning path (~${path.totalWeeks} weeks) that could lift your match score to about ${path.projectedMatchScore}%.`
        : "No training is needed for your current target.",
      data: { path, report },
    };
  },
};

export const prepareApplicationTool: AgentTool = {
  name: "prepareApplication",
  label: "Prepare application",
  description:
    "Draft the application package for a job. Never submits — it always returns a draft for review.",
  parameters: { jobId: "string" },
  sideEffect: true,
  async execute(ctx, input) {
    const jobId = String(input.jobId ?? "");
    const job = ctx.jobs.find((j) => j.id === jobId);
    if (!job) return { summary: "I could not find that job, so I could not prepare an application." };

    const match = matchJob(ctx.profile, job, { corpus: ctx.jobs });
    const required = job.skills.filter((s) => s.importance === "REQUIRED");
    const missingRequired = required.filter((s) => match.missingSkills.includes(SKILL_BY_ID.get(s.skillId)?.name ?? ""));
    const missingProfileFields: string[] = [];
    if (!ctx.profile.phone) missingProfileFields.push("Phone number");
    if (!ctx.profile.resumeText) missingProfileFields.push("Resume summary (optional)");
    if (!ctx.profile.graduationYear) missingProfileFields.push("Graduation year");
    if (!ctx.profile.salaryExpectation) missingProfileFields.push("Salary expectation");

    const coverNote =
      `Dear Hiring Team,\n\n` +
      `I am ${ctx.profile.name} from ${locationById(ctx.profile.locationId).name}. ` +
      `I am applying for the ${job.title} role at ${job.company}. ` +
      `${ctx.profile.course ? `I completed ${ctx.profile.course}${ctx.profile.graduationYear ? ` in ${ctx.profile.graduationYear}` : ""}. ` : ""}` +
      `My skills include ${match.matchedSkills.slice(0, 5).join(", ") || "relevant office and field experience"}. ` +
      `${ctx.profile.careerGoal ? `${ctx.profile.careerGoal} ` : ""}` +
      `I am available to join at the earliest and can be reached for an interview as per your convenience.\n\n` +
      `Thank you,\n${ctx.profile.name}`;

    return {
      summary: `Drafted an application for ${job.title} — ${match.score}% match${
        missingRequired.length ? `, ${missingRequired.length} required skill(s) still missing` : ""
      }. Review before submitting.`,
      jobIds: [job.id],
      matches: [match],
      requiresApproval: true,
      pendingDetails: {
        jobId: job.id,
        coverNote,
        missingRequired: missingRequired.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId),
        missingProfileFields,
        checklist: [
          "Job description parsed",
          "Profile compared against requirements",
          "Cover note drafted",
          missingProfileFields.length ? "Missing profile information flagged" : "Profile information complete",
        ],
      },
    };
  },
};

const STATUS_GROUPS: Record<string, ApplicationStatus[]> = {
  active: ["APPLIED", "UNDER_REVIEW", "INTERVIEW"],
  interview: ["INTERVIEW"],
  offers: ["SELECTED"],
  closed: ["REJECTED"],
};

export const trackApplicationTool: AgentTool = {
  name: "trackApplication",
  label: "Track applications",
  description: "List the user's applications grouped by status, with next actions.",
  parameters: { status: "string?" },
  async execute(ctx, input) {
    const status = typeof input.status === "string" ? input.status.toLowerCase() : undefined;
    let apps = ctx.applications;
    if (status && STATUS_GROUPS[status]) apps = apps.filter((a) => STATUS_GROUPS[status].includes(a.status));
    else if (status) apps = apps.filter((a) => a.status.toLowerCase() === status);

    if (!apps.length) return { summary: "You have no applications in that category yet." };

    const byStatus = apps.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: `${apps.length} application${apps.length > 1 ? "s" : ""}: ${Object.entries(byStatus)
        .map(([s, n]) => `${n} ${s.toLowerCase().replace("_", " ")}`)
        .join(", ")}.`,
      data: { applications: apps.map((a) => ({ ...a, job: ctx.jobs.find((j) => j.id === a.jobId) })) },
    };
  },
};

export const getApplicationStatusTool: AgentTool = {
  name: "getApplicationStatus",
  label: "Upcoming interviews & deadlines",
  description: "Return upcoming interviews, deadlines and next actions across applications.",
  parameters: { withinDays: "number?" },
  async execute(ctx, input) {
    const withinDays = asNumber(input.withinDays) ?? 30;
    const now = Date.now();
    const horizon = now + withinDays * 86_400_000;

    const upcoming = ctx.applications
      .filter((a) => a.interviewAt && new Date(a.interviewAt).getTime() >= now && new Date(a.interviewAt).getTime() <= horizon)
      .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime());

    const deadlines = ctx.jobs
      .filter((j) => {
        const t = new Date(j.deadline).getTime();
        return t >= now && t <= horizon && ctx.applications.some((a) => a.jobId === j.id);
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const pendingActions = ctx.applications
      .filter((a) => a.nextAction && a.status !== "REJECTED" && a.status !== "SELECTED")
      .map((a) => ({
        applicationId: a.id,
        job: ctx.jobs.find((j) => j.id === a.jobId),
        nextAction: a.nextAction,
        nextActionAt: a.nextActionAt,
      }));

    return {
      summary: upcoming.length
        ? `${upcoming.length} interview${upcoming.length > 1 ? "s" : ""} coming up${
            deadlines.length ? ` and ${deadlines.length} related deadline(s)` : ""
          }.`
        : "No interviews are scheduled in the next " + withinDays + " days.",
      data: { upcoming, deadlines, pendingActions },
    };
  },
};

export const AGENT_TOOLS: Record<AgentToolName, AgentTool> = {
  searchJobs: searchJobsTool,
  filterJobs: filterJobsTool,
  getJobDetails: getJobDetailsTool,
  analyzeSkillGap: analyzeSkillGapTool,
  recommendTraining: recommendTrainingTool,
  prepareApplication: prepareApplicationTool,
  trackApplication: trackApplicationTool,
  getApplicationStatus: getApplicationStatusTool,
};

export const AGENT_TOOL_LIST: AgentTool[] = Object.values(AGENT_TOOLS);

export function toolCatalogueForPrompt() {
  return AGENT_TOOL_LIST.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
    needsApproval: Boolean(t.sideEffect),
  }));
}

/** Shared helper used by the dashboard + agent to summarise a match list. */
export function summariseMatches(matches: JobMatch[]) {
  if (!matches.length) return "No matching jobs.";
  const avg = Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length);
  return `${matches.length} jobs, average match ${avg}% (best ${percent(
    matches[0].score,
    100,
  )}% for ${matches[0].job.title}).`;
}
