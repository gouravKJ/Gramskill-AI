import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationKanban } from "@/components/applications/kanban";
import { StatCard } from "@/components/shared/metrics";
import { DemoBadge } from "@/components/shared/brand";
import { requireWorkspace } from "@/lib/server/workspace";
import { formatDate, relativeDays } from "@/lib/utils";

export const metadata: Metadata = { title: "Application Tracker" };

export default async function ApplicationsPage() {
  const workspace = await requireWorkspace();

  const applications = workspace.applications.map((application) => ({
    ...application,
    job: workspace.jobs.find((job) => job.id === application.jobId) ?? null,
  }));

  const matches = Object.fromEntries(workspace.matches.map((m) => [m.job.id, m]));

  const upcomingInterviews = applications
    .filter((a) => a.interviewAt && new Date(a.interviewAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime());

  const deadlines = workspace.jobs
    .filter((job) => {
      const saved = workspace.applications.some((a) => a.jobId === job.id);
      const future = new Date(job.deadline).getTime() >= Date.now();
      return saved && future;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const active = applications.filter((a) => a.status !== "SELECTED" && a.status !== "REJECTED");
  const interviews = applications.filter((a) => a.status === "INTERVIEW").length;
  const offers = applications.filter((a) => a.status === "SELECTED").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Application Tracker</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Saved → Applied → Under Review → Interview → Selected. Move cards along as the employer responds.
          </p>
        </div>
        <DemoBadge />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active applications" value={active.length} icon={<FileText />} tone="primary" />
        <StatCard label="Interviews" value={interviews} icon={<Clock />} tone="secondary" />
        <StatCard label="Offers" value={offers} icon={<FileText />} tone="success" />
        <StatCard
          label="Upcoming interviews"
          value={upcomingInterviews.length}
          icon={<CalendarClock />}
          tone="warning"
        />
      </div>

      {(upcomingInterviews.length > 0 || deadlines.length > 0) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {upcomingInterviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="size-4 text-primary" />
                  Interview reminders
                </CardTitle>
                <CardDescription>What is coming up next.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingInterviews.map((application) => (
                  <div
                    key={application.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{application.job?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {application.job?.company} · {formatDate(application.interviewAt, true)}
                      </p>
                    </div>
                    <Badge variant="default">{relativeDays(application.interviewAt!)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {deadlines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-warning" />
                  Deadlines for your saved jobs
                </CardTitle>
                <CardDescription>Apply before these dates close.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlines.map((job) => {
                  const days = Math.round(
                    (new Date(job.deadline).getTime() - Date.now()) / 86_400_000,
                  );
                  return (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.company} · closes {formatDate(job.deadline)}
                        </p>
                      </div>
                      <Badge variant={days <= 3 ? "destructive" : "warning"}>
                        {days <= 0 ? "Closing today" : `${days} day${days === 1 ? "" : "s"} left`}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ApplicationKanban applications={applications} matches={matches} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            Reminder: applications in this build are <strong>demo records</strong> stored in the GramSkill
            database. No email is sent and no employer is notified. Connect a real integration in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">POST /api/applications</code>.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/agent">Prepare an application with the AI</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
