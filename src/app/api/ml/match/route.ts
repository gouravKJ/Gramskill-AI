import { z } from "zod";
import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";
import { matchJob } from "@/lib/ai/match-engine";
import { predictWithMlService } from "@/lib/server/ml-service";

export const dynamic = "force-dynamic";

const schema = z.object({ jobId: z.string().min(1) });

/**
 * POST /api/ml/match
 *
 * Calls the Python FastAPI service when `ML_SERVICE_URL` is configured, and
 * transparently falls back to the in-process TypeScript matcher otherwise.
 * The response always reports which engine produced the score, so the UI can
 * be honest about it.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const { jobId } = schema.parse(await request.json().catch(() => ({})));

  const job = workspace.jobs.find((j) => j.id === jobId);
  const localMatch = job ? matchJob(workspace.profile, job, { corpus: workspace.jobs }) : null;

  if (job) {
    const { engine, prediction } = await predictWithMlService({
      profile: {
        ...workspace.profile,
        skillIds: workspace.profile.skills.map((s) => s.skillId),
        skillIdsWithLevels: workspace.profile.skills,
      },
      job: { ...job, skillIds: job.skills },
    });
    if (prediction) return ok({ engine, prediction, localMatch });
  }

  return ok({ engine: "typescript-matcher", prediction: null, localMatch });
});
