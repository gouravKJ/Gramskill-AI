import { requireWorkspace } from "@/lib/server/workspace";
import { handler, ok } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations
 * Ranked, explainable job list for the signed-in seeker. Optional query params:
 *   ?limit=12 &minScore=60 &maxDistanceKm=60
 */
export const GET = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  const url = new URL(request.url);

  const limit = Number(url.searchParams.get("limit") ?? 12);
  const minScore = Number(url.searchParams.get("minScore") ?? 0);
  const maxDistanceKm = url.searchParams.get("maxDistanceKm");

  const matches = workspace.matches
    .filter((m) => m.score >= minScore)
    .filter((m) =>
      maxDistanceKm == null || m.distanceKm == null ? true : m.distanceKm <= Number(maxDistanceKm),
    )
    .slice(0, limit);

  return ok({
    matchScore: workspace.matchScore,
    total: workspace.matches.length,
    recommendations: matches,
  });
});
