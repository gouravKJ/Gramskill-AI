import type { Metadata } from "next";
import { JobsExplorer } from "@/components/jobs/jobs-explorer";
import { requireWorkspace } from "@/lib/server/workspace";

export const metadata: Metadata = { title: "Job Matches" };

export default async function JobsPage() {
  const workspace = await requireWorkspace();

  // Serialisable map keeps the client bundle small (only the ids it needs).
  const matches = Object.fromEntries(workspace.matches.map((m) => [m.job.id, m]));

  return (
    <JobsExplorer
      jobs={workspace.jobs}
      matches={matches}
      applications={workspace.applications}
      locations={workspace.locations}
      matchScore={workspace.matchScore}
    />
  );
}
