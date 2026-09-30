import { z } from "zod";
import { requireWorkspace } from "@/lib/server/workspace";
import { fail, handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

const enrollSchema = z.object({
  trainingId: z.string().min(1),
  status: z.enum(["RECOMMENDED", "ENROLLED", "IN_PROGRESS", "COMPLETED"]).default("ENROLLED"),
  progress: z.number().int().min(0).max(100).optional(),
});

/** POST /api/training/enroll — start or update a learning path step. */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const body = await request.json().catch(() => ({}));
  const input = enrollSchema.parse(body);

  const training = workspace.training.find((t) => t.id === input.trainingId);
  if (!training) return fail("That training programme is not in the catalogue.", 404);

  const record = await workspace.repo.setUserTraining(workspace.session.id, input.trainingId, {
    status: input.status,
    progress: input.progress,
  });

  return ok({ enrolment: record, training });
});
