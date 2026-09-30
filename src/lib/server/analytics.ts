import { getRepository } from "@/lib/data/repository";
import { matchJobs, overallMatchScore } from "@/lib/ai/match-engine";
import { analyzeSkillGaps } from "@/lib/ai/skill-gap";
import { SKILL_BY_ID, locationById } from "@/lib/data/catalogue";
import type { Application, Job, SkillGap, Training, User } from "@/types";

/**
 * Platform analytics.
 *
 * IMPORTANT: every number below is aggregated from the records actually present
 * in the active data source (demo dataset or PostgreSQL). Nothing here is a
 * hard-coded or invented statistic — the AI Insights copy is generated from
 * these aggregates so it stays truthful as the dataset changes.
 */

export interface Counted {
  key: string;
  label: string;
  count: number;
}

export interface Analytics {
  totals: {
    users: number;
    seekers: number;
    admins: number;
    jobs: number;
    openJobs: number;
    applications: number;
    trainings: number;
    trainingEnrolments: number;
    totalOpenings: number;
  };
  usersByLocation: Counted[];
  usersByEducation: Counted[];
  popularSkills: Counted[];
  demandedSkills: Counted[];
  demandedJobs: Counted[];
  /** Job titles the matcher actually ranked #1 for the most demo seekers. */
  recommendedJobTitles: Counted[];
  sectors: Counted[];
  applicationFunnel: Counted[];
  conversionRate: number;
  interviewRate: number;
  averageMatchScore: number;
  skillGapDemand: Counted[];
  topGapSkill: string | null;
  insights: string[];
}

export async function computeAnalytics(): Promise<Analytics> {
  const repo = await getRepository();
  const [users, jobs, trainings, skills] = await Promise.all([
    repo.listUsers(),
    repo.allJobs(),
    repo.listTraining(),
    repo.listSkills(),
  ]);

  const applicationsByUser = await Promise.all(
    users.map(async (user) => ({ user, applications: await repo.listApplications(user.id) })),
  );
  const allApplications: Application[] = applicationsByUser.flatMap((entry) => entry.applications);

  const userTrainings = await Promise.all(
    users.map(async (user) => repo.listUserTraining(user.id)),
  );
  const allUserTrainings = userTrainings.flat();

  const skillGapsPerUser = await Promise.all(users.map(async (user) => repo.listSkillGaps(user.id)));
  const storedGaps = skillGapsPerUser.flat();

  /* ------------------------------ aggregates --------------------------- */

  const seekers = users.filter((u) => u.role === "SEEKER");

  const usersByLocation = countBy(
    seekers.map((u) => u.profile.locationId),
    (id) => locationById(id).name,
  );

  const usersByEducation = countBy(
    seekers.map((u) => u.profile.education ?? "Not specified"),
    (v) => educationLabel(String(v)),
  );

  const popularSkills = countBy(
    seekers.flatMap((u) => u.profile.skills.map((s) => s.skillId)),
    (id) => SKILL_BY_ID.get(id)?.name ?? id,
  );

  const demandedSkills = countBy(
    jobs.flatMap((j) => j.skills.filter((s) => s.importance === "REQUIRED").map((s) => s.skillId)),
    (id) => SKILL_BY_ID.get(id)?.name ?? id,
  );

  const demandedJobs = countBy(
    jobs.map((j) => j.title),
    (title) => title,
  );

  const sectors = countBy(
    jobs.map((j) => j.sector),
    (s) => s,
  );

  const applicationFunnel = ["SAVED", "APPLIED", "UNDER_REVIEW", "INTERVIEW", "SELECTED", "REJECTED"].map(
    (status) => ({
      key: status,
      label: status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      count: allApplications.filter((a) => a.status === status).length,
    }),
  );

  const submitted = allApplications.filter((a) => a.status !== "SAVED").length;
  const interviewOrBetter = allApplications.filter((a) =>
    ["INTERVIEW", "SELECTED"].includes(a.status),
  ).length;

  // Live skill-gap demand: combine persisted gaps (if any) with freshly computed
  // gaps so the insight is meaningful even on a cold database.
  const computedGaps = seekers.flatMap((user) =>
    analyzeSkillGaps(user.profile, { jobs, training: trainings }).gaps,
  );
  const gapPool: SkillGap[] = storedGaps.length ? storedGaps : computedGaps;
  const gapCounts = new Map<string, number>();
  for (const gap of gapPool) {
    gapCounts.set(gap.skillId, (gapCounts.get(gap.skillId) ?? 0) + 1);
  }
  const skillGapDemand: Counted[] = [...gapCounts.entries()]
    .map(([skillId, count]) => ({ key: skillId, label: SKILL_BY_ID.get(skillId)?.name ?? skillId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recommendations are produced by running the real matcher, so the
  // "most recommended role" insight reflects actual model output.
  const perUserMatches = seekers.map((user) => matchJobs(user.profile, { jobs, corpus: jobs }));
  const recommendedJobTitles: Counted[] = countBy(
    perUserMatches.flatMap((m) => (m[0] ? [m[0].job.title] : [])),
    (title) => title,
  );

  const matchScores = perUserMatches.map((m) => overallMatchScore(m));
  const averageMatchScore = matchScores.length
    ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
    : 0;

  const analytics: Analytics = {
    totals: {
      users: users.length,
      seekers: seekers.length,
      admins: users.length - seekers.length,
      jobs: jobs.length,
      openJobs: jobs.filter((j) => new Date(j.deadline).getTime() >= Date.now()).length,
      applications: allApplications.length,
      trainings: trainings.length,
      trainingEnrolments: allUserTrainings.length,
      totalOpenings: jobs.reduce((sum, j) => sum + j.openings, 0),
    },
    usersByLocation,
    usersByEducation,
    popularSkills,
    demandedSkills,
    demandedJobs,
    recommendedJobTitles,
    sectors,
    applicationFunnel,
    conversionRate: submitted ? Math.round((interviewOrBetter / submitted) * 100) : 0,
    interviewRate: submitted ? Math.round((interviewOrBetter / submitted) * 100) : 0,
    averageMatchScore,
    skillGapDemand,
    topGapSkill: skillGapDemand[0]?.label ?? null,
    insights: [],
  };

  analytics.insights = buildInsights(analytics, {
    users,
    jobs,
    trainings,
    skillsCount: skills.length,
    applications: allApplications,
  });

  return analytics;
}

function countBy(values: string[], labeller: (value: string) => string): Counted[] {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: labeller(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function educationLabel(value: string) {
  const map: Record<string, string> = {
    BELOW_10: "Below Class 10",
    CLASS_10: "Class 10",
    CLASS_12: "Class 12",
    ITI: "ITI",
    DIPLOMA: "Diploma",
    GRADUATE: "Graduate",
    POST_GRADUATE: "Post Graduate",
    "Not specified": "Not specified",
  };
  return map[value] ?? value;
}

function buildInsights(
  analytics: Analytics,
  ctx: {
    users: User[];
    jobs: Job[];
    trainings: Training[];
    skillsCount: number;
    applications: Application[];
  },
): string[] {
  const insights: string[] = [];
  const totalJobs = ctx.jobs.length;

  const topSkill = analytics.demandedSkills[0];
  if (topSkill) {
    insights.push(
      `"${topSkill.label}" is the most requested skill across the ${totalJobs} postings in this demo dataset (required by ${topSkill.count} jobs).`,
    );
  }

  const topGap = analytics.skillGapDemand[0];
  if (topGap) {
    insights.push(
      `${topGap.count} of ${analytics.totals.seekers} demo job seekers currently need ${topGap.label} training to qualify for their top matching roles.`,
    );
  }

  const topRecommended = analytics.recommendedJobTitles[0];
  if (topRecommended) {
    insights.push(
      `Most recommended role by the matching engine: ${topRecommended.label} — it ranked #1 for ${topRecommended.count} of ${analytics.totals.seekers} demo seekers.`,
    );
  }

  const topLocation = analytics.usersByLocation[0];
  if (topLocation) {
    insights.push(
      `${topLocation.label} has the largest share of demo job seekers (${topLocation.count} profiles), which is where location-aware matching matters most.`,
    );
  }

  const topPopular = analytics.popularSkills[0];
  if (topPopular) {
    insights.push(
      `The most commonly listed user skill is ${topPopular.label} (${topPopular.count} profiles), while employers ask for ${
        analytics.demandedSkills[0]?.label ?? "a different mix"
      } most often — a useful supply/demand signal.`,
    );
  }

  insights.push(
    `${analytics.totals.totalOpenings} total openings across ${analytics.totals.openJobs} currently open postings, with an average AI match score of ${analytics.averageMatchScore}% for demo seekers.`,
  );

  const interviewCount = analytics.applicationFunnel.find((f) => f.key === "INTERVIEW")?.count ?? 0;
  const selectedCount = analytics.applicationFunnel.find((f) => f.key === "SELECTED")?.count ?? 0;
  if (analytics.totals.applications) {
    insights.push(
      `Application funnel: ${analytics.totals.applications} applications recorded, ${interviewCount} reached interview stage and ${selectedCount} converted to an offer in this dataset.`,
    );
  }

  const freeTraining = ctx.trainings.filter((t) => t.cost === 0).length;
  insights.push(
    `${freeTraining} of ${ctx.trainings.length} listed training programmes are free to enrol, which matters for rural candidates with limited travel budgets.`,
  );

  return insights;
}
