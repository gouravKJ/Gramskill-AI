import { getSession } from "@/lib/auth/session";
import { handler, ok } from "@/lib/api/http";
import { computeAnalytics } from "@/lib/server/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/insights
 * Data-derived insights. Available to any signed-in user (the landing page
 * shows the same aggregate panel in a read-only form).
 */
export const GET = handler(async () => {
  const session = await getSession();
  const analytics = await computeAnalytics();

  return ok({
    authenticated: Boolean(session),
    insights: analytics.insights,
    generatedAt: new Date().toISOString(),
    sampleSize: {
      seekers: analytics.totals.seekers,
      jobs: analytics.totals.jobs,
      applications: analytics.totals.applications,
      trainings: analytics.totals.trainings,
    },
    aggregates: {
      topSkills: analytics.demandedSkills.slice(0, 6),
      gapDemand: analytics.skillGapDemand.slice(0, 6),
      locations: analytics.usersByLocation.slice(0, 6),
      funnel: analytics.applicationFunnel,
      averageMatchScore: analytics.averageMatchScore,
    },
  });
});
