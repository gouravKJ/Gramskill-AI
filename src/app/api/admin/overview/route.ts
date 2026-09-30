import { requireAdmin } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";
import { computeAnalytics } from "@/lib/server/analytics";
import { getRepository } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

/** GET /api/admin/overview — aggregate metrics for the admin dashboard. */
export const GET = handler(async () => {
  await requireAdmin();
  const repo = await getRepository();
  const [analytics, users, jobs, training] = await Promise.all([
    computeAnalytics(),
    repo.listUsers(),
    repo.allJobs(),
    repo.listTraining(),
  ]);

  return ok({
    analytics,
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.profile.name,
      locationId: u.profile.locationId,
      education: u.profile.education,
      skills: u.profile.skills.length,
      completion: u.profile.onboardingCompleted,
      createdAt: u.createdAt,
    })),
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      locationId: j.locationId,
      openings: j.openings,
      deadline: j.deadline,
      source: j.source,
      sector: j.sector,
    })),
    training: training.map((t) => ({
      id: t.id,
      title: t.title,
      provider: t.provider,
      durationWeeks: t.durationWeeks,
      cost: t.cost,
      enrolments: t.enrolments,
    })),
  });
});
