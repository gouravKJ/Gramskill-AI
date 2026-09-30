import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";
import { matchRequestSchema } from "@/lib/validators";
import { filterJobs } from "@/lib/data/job-query";
import { matchJob } from "@/lib/ai/match-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/job-match
 * Score a specific set of jobs (or an ad-hoc filtered pool) against the profile.
 * Used by the "Why this match?" panel and by the agent's scoring tool.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const body = await request.json().catch(() => ({}));
  const input = matchRequestSchema.parse(body);

  const pool = input.filters
    ? filterJobs(workspace.jobs, input.filters, workspace.profile.locationId)
    : workspace.jobs;

  const selected = input.jobIds?.length
    ? pool.filter((job) => input.jobIds!.includes(job.id))
    : pool.slice(0, 60);

  const matches = selected
    .map((job) => matchJob(workspace.profile, job, { corpus: workspace.jobs }))
    .filter((m) => m.score >= (input.minScore ?? 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit);

  return ok({ matches });
});
