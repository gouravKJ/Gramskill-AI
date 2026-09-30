import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { loadWorkspace } from "@/lib/server/workspace";

export const dynamic = "force-dynamic";

/**
 * Authenticated route group.
 *
 * Middleware already blocks anonymous traffic; this layout additionally handles
 * the onboarding gate and provides the shell (sidebar, top bar, bottom nav).
 * Children under `(onboarding)` opt out of the shell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = await loadWorkspace();
  if (!workspace) redirect("/login?next=%2Fdashboard");

  return (
    <AppShell
      session={workspace.session}
      notifications={workspace.notifications}
      applicationCount={workspace.applications.filter((a) => a.status !== "SAVED").length}
      dataSource={workspace.repo.source}
    >
      {children}
    </AppShell>
  );
}
