import { handler, ok } from "@/lib/api/http";
import { getRepository } from "@/lib/data/repository";
import { probeMlService } from "@/lib/server/ml-service";

export const dynamic = "force-dynamic";

/**
 * Used by deployment platforms (Render health checks) and the smoke-test script.
 *
 * Reading `process.env.ML_SERVICE_URL` only proves an env var exists — the
 * service may be down, or still booting. We actually call it, with a short
 * timeout, so the report reflects reality.
 */
export const GET = handler(async () => {
  const repo = await getRepository();
  const [jobs, skills, ml] = await Promise.all([
    repo.allJobs(),
    repo.listSkills(),
    probeMlService(),
  ]);

  return ok({
    status: "healthy",
    service: "gramskill-ai",
    dataSource: repo.source,
    counts: { jobs: jobs.length, skills: skills.length },
    mlService: ml.status,
    mlModelKind: ml.modelKind ?? null,
    mlSemanticBackend: ml.semanticBackend ?? null,
    llm: process.env.LLM_PROVIDER ? "configured" : "not-configured (deterministic planner in use)",
    timestamp: new Date().toISOString(),
  });
});
