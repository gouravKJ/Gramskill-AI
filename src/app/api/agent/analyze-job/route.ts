import { z } from "zod";
import { requireWorkspace } from "@/lib/server/workspace";
import { fail, handler, ok } from "@/lib/api/http";
import { AGENT_TOOLS } from "@/lib/ai/agent/tools";

export const dynamic = "force-dynamic";

const schema = z.object({ jobId: z.string().min(1) });

/**
 * POST /api/agent/analyze-job
 * Runs the `getJobDetails` + `analyzeSkillGap` tool pair for one job and returns
 * the explanation, the skill gaps and the training that closes them.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const { jobId } = schema.parse(await request.json().catch(() => ({})));

  const job = workspace.jobs.find((j) => j.id === jobId);
  if (!job) return fail("Job not found in the current dataset.", 404);

  const context = {
    profile: workspace.profile,
    jobs: workspace.jobs,
    training: workspace.training,
    applications: workspace.applications,
  };

  const details = await AGENT_TOOLS.getJobDetails.execute(context, { jobId });
  const gap = await AGENT_TOOLS.analyzeSkillGap.execute(context, { targetJobId: jobId });
  const training = await AGENT_TOOLS.recommendTraining.execute(context, { targetJobId: jobId });

  return ok({
    summary: details.summary,
    match: details.matches?.[0] ?? null,
    skillGaps: gap.data,
    learningPath: (training.data as { path?: unknown }).path ?? null,
    applied: workspace.applications.some((a) => a.jobId === jobId),
  });
});
