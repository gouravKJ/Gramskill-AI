import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** GET /api/training — catalogue plus the personalised learning path. */
export const GET = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const url = new URL(request.url);
  const skillId = url.searchParams.get("skillId");

  const catalogue = skillId
    ? workspace.training.filter((t) => t.skillIds.includes(skillId))
    : workspace.training;

  return ok({
    catalogue,
    learningPath: workspace.learningPath,
    gaps: workspace.skillGapReport.gaps,
    enrolled: workspace.userTraining,
  });
});
