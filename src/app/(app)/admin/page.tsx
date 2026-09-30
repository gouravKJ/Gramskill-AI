import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/admin-panel";
import { requireAdminWorkspace } from "@/lib/server/workspace";
import { computeAnalytics } from "@/lib/server/analytics";

export const metadata: Metadata = { title: "Admin Dashboard" };

/**
 * Admin area. `requireAdminWorkspace` throws on non-admin sessions, and the
 * middleware already redirects them — so this is defence in depth rather than
 * the only check.
 */
export default async function AdminPage() {
  const workspace = await requireAdminWorkspace();
  const analytics = await computeAnalytics();

  const users = await workspace.repo.listUsers();

  return (
    <AdminPanel
      analytics={analytics}
      users={users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.profile.name,
        locationId: user.profile.locationId,
        education: user.profile.education,
        skills: user.profile.skills.length,
        completion: user.profile.onboardingCompleted,
        createdAt: user.createdAt,
      }))}
      jobs={workspace.jobs.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        locationId: job.locationId,
        openings: job.openings,
        deadline: job.deadline,
        source: job.source,
        sector: job.sector,
      }))}
      training={workspace.training.map((programme) => ({
        id: programme.id,
        title: programme.title,
        provider: programme.provider,
        durationWeeks: programme.durationWeeks,
        cost: programme.cost,
        enrolments: programme.enrolments,
      }))}
      skills={workspace.skills}
      locations={workspace.locations}
    />
  );
}
