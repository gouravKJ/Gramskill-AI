import { requireWorkspace } from "@/lib/server/workspace";
import { fail, handler, ok } from "@/lib/api/http";
import { updateApplicationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const PATCH = handler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const workspace = await requireWorkspace();
  const body = await request.json().catch(() => ({}));
  const input = updateApplicationSchema.parse(body);

  const existing = await workspace.repo.getApplication(id);
  // Ownership check — an application id alone must never be enough to edit it.
  if (!existing || existing.userId !== workspace.session.id) {
    return fail("Application not found.", 404);
  }

  const application = await workspace.repo.updateApplicationStatus(id, input.status, input.note, {
    interviewAt: input.interviewAt,
    nextAction: input.nextAction,
    nextActionAt: input.nextActionAt,
  });

  return ok({ application });
});
