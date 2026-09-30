import { z } from "zod";
import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";
import { filterJobsTool, searchJobsTool } from "@/lib/ai/agent/tools";

export const dynamic = "force-dynamic";

const schema = z.object({
  query: z.string().trim().max(120).default(""),
  maxDistanceKm: z.number().min(1).max(1000).optional(),
  minSalary: z.number().int().min(0).optional(),
  remoteOnly: z.boolean().optional(),
});

/**
 * POST /api/agent/search-jobs
 * Exposes the agent's `searchJobs` tool over HTTP so external clients (or a
 * future mobile app) can use the same matching behaviour as the chat.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const input = schema.parse(await request.json().catch(() => ({})));

  const context = {
    profile: workspace.profile,
    jobs: workspace.jobs,
    training: workspace.training,
    applications: workspace.applications,
  };

  const result = input.query
    ? await searchJobsTool.execute(context, { query: input.query, maxDistanceKm: input.maxDistanceKm })
    : await filterJobsTool.execute(context, {
        maxDistanceKm: input.maxDistanceKm,
        minSalary: input.minSalary,
        remoteOnly: input.remoteOnly,
      });

  return ok({
    summary: result.summary,
    matches: result.matches ?? [],
  });
});
