import { cache } from "react";
import { getSession, requireAdmin, requireUser } from "@/lib/auth/session";
import { getRepository, type Repository } from "@/lib/data/repository";
import { SKILL_BY_ID, locationById } from "@/lib/data/catalogue";
import { matchJobs, overallMatchScore, type SkillOverlap } from "@/lib/ai/match-engine";
import { analyzeSkillGaps, buildLearningPath, type SkillGapReport } from "@/lib/ai/skill-gap";
import type {
  Application,
  Job,
  JobMatch,
  Location,
  Notification,
  Profile,
  Skill,
  Training,
  User,
  UserTraining,
} from "@/types";

/**
 * Everything a signed-in screen needs, loaded once on the server.
 *
 * Keeping this in one place means pages, API routes and the agent all see an
 * identical view of the user's world — no duplicated scoring logic, no drift
 * between the dashboard and the agent.
 */
export interface Workspace {
  repo: Repository;
  session: { id: string; email: string; role: "SEEKER" | "ADMIN"; name: string };
  user: User;
  profile: Profile;
  skills: Skill[];
  locations: Location[];
  jobs: Job[];
  training: Training[];
  applications: Application[];
  userTraining: UserTraining[];
  notifications: Notification[];
  matches: JobMatch[];
  matchScore: number;
  skillGapReport: SkillGapReport;
  learningPath: ReturnType<typeof buildLearningPath>;
  profileCompletion: number;
  applicationsByStatus: Record<string, Application[]>;
}

/**
 * Cached per request so a layout and its page share one computation instead of
 * running the matching engine twice.
 */
export const loadWorkspace = cache(async (): Promise<Workspace | null> => {
  const session = await getSession();
  if (!session) return null;

  const repo = await getRepository();
  const user = await repo.findUserById(session.id);
  if (!user) return null;

  const [skills, locations, jobs, training, applications, userTraining, notifications] = await Promise.all([
    repo.listSkills(),
    repo.listLocations(),
    repo.allJobs(),
    repo.listTraining(),
    repo.listApplications(user.id),
    repo.listUserTraining(user.id),
    repo.listNotifications(user.id),
  ]);

  const matches = matchJobs(user.profile, { jobs, corpus: jobs });
  const skillGapReport = analyzeSkillGaps(user.profile, { jobs, training });
  const learningPath = buildLearningPath(user.profile, skillGapReport, training, skillGapReport.targetJob);

  return {
    repo,
    session: { id: session.id, email: session.email, role: session.role, name: session.name || user.profile.name },
    user,
    profile: user.profile,
    skills,
    locations,
    jobs,
    training,
    applications,
    userTraining,
    notifications,
    matches,
    matchScore: overallMatchScore(matches),
    skillGapReport,
    learningPath,
    profileCompletion: profileCompletion(user.profile),
    applicationsByStatus: groupByStatus(applications),
  };
});

export async function requireWorkspace(): Promise<Workspace> {
  await requireUser();
  const workspace = await loadWorkspace();
  if (!workspace) throw new Error("Unable to load your workspace. Please sign in again.");
  return workspace;
}

export async function requireAdminWorkspace(): Promise<Workspace> {
  await requireAdmin();
  const workspace = await loadWorkspace();
  if (!workspace) throw new Error("Unable to load the admin workspace. Please sign in again.");
  return workspace;
}

function groupByStatus(applications: Application[]) {
  return applications.reduce<Record<string, Application[]>>((acc, app) => {
    acc[app.status] = [...(acc[app.status] ?? []), app];
    return acc;
  }, {});
}

/**
 * Profile completeness drives the dashboard ring and the "finish your profile"
 * nudges. Each field is weighted by how much it actually changes match quality.
 */
export function profileCompletion(profile: Profile): number {
  const checks: [boolean, number][] = [
    [Boolean(profile.name), 6],
    [profile.age != null, 4],
    [Boolean(profile.locationId), 10],
    [Boolean(profile.education), 12],
    [Boolean(profile.course), 6],
    [profile.graduationYear != null, 5],
    [Boolean(profile.experience), 10],
    [profile.skills.length >= 3, 18],
    [profile.jobTypes.length > 0, 7],
    [profile.workModes.length > 0, 6],
    [profile.preferredLocationIds.length > 0, 6],
    [profile.salaryExpectation != null, 5],
    [profile.industries.length > 0, 3],
    [profile.careerGoal.length > 10, 2],
  ];
  const total = checks.reduce((sum, [, weight]) => sum + weight, 0);
  const earned = checks.reduce((sum, [done, weight]) => sum + (done ? weight : 0), 0);
  return Math.round((earned / total) * 100);
}

/** Convenience view-model for skill chips with the user's level attached. */
export function decorateSkills(profile: Profile) {
  return profile.skills.map((s) => {
    const skill = SKILL_BY_ID.get(s.skillId);
    return {
      ...s,
      name: skill?.name ?? s.skillId,
      category: skill?.category ?? "General",
      learningWeeks: skill?.learningWeeks ?? 4,
    };
  });
}

export function locationName(id: string) {
  return locationById(id).name;
}

/** Skill overlap helper re-exported for pages that render per-job chips. */
export type { SkillOverlap };
