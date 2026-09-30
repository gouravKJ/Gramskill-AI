import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/** GET /api/skill-gaps?targetJobId=... — recompute and persist the gap report. */
export const GET = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const url = new URL(request.url);
  const targetJobId = url.searchParams.get("targetJobId") ?? undefined;

  return ok({
    report: workspace.skillGapReport,
    targetJobId: targetJobId ?? workspace.skillGapReport.targetJob?.id ?? null,
    stored: await workspace.repo.listSkillGaps(workspace.session.id),
  });
});

/** POST /api/skill-gaps — persist the freshly detected gaps for analytics. */
export const POST = handler(async () => {
  const workspace = await requireWorkspace();
  await workspace.repo.replaceSkillGaps(workspace.session.id, workspace.skillGapReport.gaps);
  return ok({
    persisted: workspace.skillGapReport.gaps.length,
    gaps: workspace.skillGapReport.gaps,
  });
});
