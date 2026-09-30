import { requireWorkspace } from "@/lib/server/workspace";
import { fail, handler, ok } from "@/lib/api/http";
import { createApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/applications — the tracker board, with job details attached. */
export const GET = handler(async () => {
  const workspace = await requireWorkspace();

  const applications = workspace.applications.map((application) => ({
    ...application,
    job: workspace.jobs.find((j) => j.id === application.jobId) ?? null,
  }));

  const upcomingInterviews = applications
    .filter((a) => a.interviewAt && new Date(a.interviewAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime());

  const deadlines = workspace.jobs
    .filter((job) => new Date(job.deadline).getTime() >= Date.now())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 6);

  return ok({
    applications,
    byStatus: workspace.applicationsByStatus,
    upcomingInterviews,
    deadlines,
  });
});

/**
 * POST /api/applications
 * The `confirmed: true` literal in the schema is the machine-readable form of
 * the "Review Application → Confirm & Submit" gate: no code path can create an
 * application without the user having reviewed it.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const body = await request.json().catch(() => ({}));
  const input = createApplicationSchema.parse(body);

  const job = workspace.jobs.find((j) => j.id === input.jobId);
  if (!job) return fail("That job is not available in the current dataset.", 404);

  const application = await workspace.repo.createApplication({
    userId: workspace.session.id,
    jobId: input.jobId,
    status: input.status,
    coverNote: input.coverNote,
    nextAction: input.nextAction || defaultNextAction(input.status),
  });

  return ok({ application, job, demo: true });
});

function defaultNextAction(status: string) {
  switch (status) {
    case "SAVED":
      return "Complete any missing skills, then apply.";
    case "APPLIED":
      return "Wait for screening; follow up in one week.";
    default:
      return "Check the tracker for updates.";
  }
}
