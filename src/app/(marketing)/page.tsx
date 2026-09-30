import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import {
  CtaSection,
  DemoPersona,
  FaqSection,
  FeatureGrid,
  HowItWorks,
  InsightsPreview,
  PipelineSection,
  PublicOpportunities,
  TrustStrip,
} from "@/components/landing/sections";
import { computeAnalytics } from "@/lib/server/analytics";

export const metadata: Metadata = {
  title: "GramSkill AI — Turn Your Skills Into Your Next Opportunity",
};

/**
 * Landing page.
 *
 * The insights panel is server-rendered from the live dataset rather than
 * hard-coded, so the numbers on the marketing page always match the data the
 * rest of the app uses.
 */
export default async function LandingPage() {
  const analytics = await computeAnalytics();

  return (
    <>
      <Hero />
      <TrustStrip />
      <FeatureGrid />
      <HowItWorks />
      <PipelineSection />
      <DemoPersona />
      <InsightsPreview
        insights={analytics.insights}
        sampleSize={{
          seekers: analytics.totals.seekers,
          jobs: analytics.totals.jobs,
          applications: analytics.totals.applications,
          trainings: analytics.totals.trainings,
        }}
        topSkills={analytics.demandedSkills.slice(0, 6).map((s) => ({ label: s.label, count: s.count }))}
      />
      <PublicOpportunities />
      <FaqSection />
      <CtaSection />
    </>
  );
}
