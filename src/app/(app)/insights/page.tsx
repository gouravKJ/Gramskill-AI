import type { Metadata } from "next";
import { BarChart3, Database, Lightbulb, Sparkles, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { StatCard } from "@/components/shared/metrics";
import { ApplicationStatusChart } from "@/components/dashboard/charts";
import { computeAnalytics } from "@/lib/server/analytics";
import { requireWorkspace } from "@/lib/server/workspace";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Insights" };

export default async function InsightsPage() {
  const [workspace, analytics] = await Promise.all([requireWorkspace(), computeAnalytics()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <Sparkles className="size-5 text-secondary" />
            AI Insights
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every statement on this page is computed from the records in the active dataset — regenerated on
            each request, never hard-coded.
          </p>
        </div>
        <DemoBadge long />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Seeker profiles" value={analytics.totals.seekers} icon={<Users />} tone="primary" />
        <StatCard label="Job postings" value={analytics.totals.jobs} icon={<Database />} tone="secondary" />
        <StatCard
          label="Applications tracked"
          value={analytics.totals.applications}
          icon={<BarChart3 />}
          tone="success"
        />
        <StatCard
          label="Average match score"
          value={analytics.averageMatchScore}
          suffix="%"
          icon={<TrendingUp />}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-primary" />
              Generated insights
            </CardTitle>
            <CardDescription>
              Sample size: {analytics.totals.seekers} seekers · {analytics.totals.jobs} postings ·{" "}
              {analytics.totals.applications} applications · {analytics.totals.trainings} programmes ·{" "}
              {analytics.totals.totalOpenings} total openings.
            </CardDescription>
          </div>
          <AiTag />
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {analytics.insights.map((insight, index) => (
              <li
                key={insight}
                className="flex gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {index + 1}
                </span>
                {insight}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Generated {formatDate(new Date(), true)}. Recompute by reloading this page — there is no cached
            snapshot.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ApplicationStatusChart applications={workspace.applications} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most in-demand skills</CardTitle>
            <CardDescription>Counted from REQUIRED skills across all demo postings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.demandedSkills.slice(0, 8).map((skill) => {
              const max = analytics.demandedSkills[0]?.count || 1;
              return (
                <div key={skill.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{skill.label}</span>
                    <span className="tabular-nums text-muted-foreground">{skill.count} jobs</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(skill.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skill-gap demand</CardTitle>
            <CardDescription>Skills most demo seekers are missing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analytics.skillGapDemand.slice(0, 6).map((gap) => (
              <div key={gap.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium">{gap.label}</span>
                <Badge variant="warning">{gap.count} seekers</Badge>
              </div>
            ))}
            {analytics.skillGapDemand.length === 0 && (
              <p className="text-xs text-muted-foreground">No gaps recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seekers by location</CardTitle>
            <CardDescription>Where the demand for matching is highest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analytics.usersByLocation.slice(0, 6).map((location) => (
              <div key={location.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium">{location.label}</span>
                <Badge variant="secondary">{location.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application funnel</CardTitle>
            <CardDescription>Conversion across the demo pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {analytics.applicationFunnel.map((stage) => (
              <div key={stage.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium">{stage.label}</span>
                <span className="tabular-nums text-muted-foreground">{stage.count}</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              Interview-or-better rate: {analytics.interviewRate}% of submitted applications.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-[11px] leading-relaxed text-secondary">
        These aggregates describe a <strong>fictional demo dataset</strong>. They are useful for validating
        the analytics pipeline, but they are not real labour-market statistics and must not be cited as such.
      </p>
    </div>
  );
}
