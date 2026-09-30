import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Landmark,
  Route,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { DemoBadge } from "@/components/shared/brand";
import { JobCard } from "@/components/jobs/job-card";
import { locationById } from "@/lib/data/catalogue";
import { formatINR, labelEnum } from "@/lib/utils";
import { requireWorkspace } from "@/lib/server/workspace";
import type { OpportunitySource } from "@/types";

export const metadata: Metadata = { title: "Public & Community Opportunities" };

const CATEGORIES: {
  source: OpportunitySource;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    source: "GOVERNMENT",
    title: "Government Jobs",
    description: "District administration, postal services, health missions and scheme-linked contracts.",
    icon: Landmark,
  },
  {
    source: "APPRENTICESHIP",
    title: "Apprenticeships",
    description: "Paid, scheme-backed training that ends with a recognised certificate.",
    icon: Route,
  },
  {
    source: "SKILL_DEVELOPMENT",
    title: "Skill Development",
    description: "Short NSQF-aligned courses, mostly free, run through local skill centres.",
    icon: GraduationCap,
  },
  {
    source: "LOCAL",
    title: "Local Employment",
    description: "Cooperative, FPO and MSME roles within daily commuting distance.",
    icon: Building2,
  },
  {
    source: "SELF_EMPLOYMENT",
    title: "Self-Employment Programmes",
    description: "Micro-enterprise support with training, credit linkage and mentoring.",
    icon: TrendingUp,
  },
];

export default async function OpportunitiesPage() {
  const workspace = await requireWorkspace();

  const bySource = new Map<OpportunitySource, typeof workspace.jobs>();
  for (const job of workspace.jobs) {
    bySource.set(job.source, [...(bySource.get(job.source) ?? []), job]);
  }

  const matchMap = new Map(workspace.matches.map((m) => [m.job.id, m]));
  const savedIds = new Set(workspace.applications.map((a) => a.jobId));

  const totalPublic = workspace.jobs.filter((job) => job.source !== "PRIVATE").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Public &amp; Community Opportunities
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Beyond private employers: {totalPublic} public, cooperative and self-employment opportunities in
            the demo dataset, ranked with your profile in the same way as private jobs.
          </p>
        </div>
        <DemoBadge />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((category) => {
          const count = bySource.get(category.source)?.length ?? 0;
          return (
            <Card key={category.source} className="transition-all hover:-translate-y-0.5">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                  <category.icon className="size-5" />
                </span>
                <CardTitle className="pt-2 text-sm">{category.title}</CardTitle>
                <CardDescription className="text-xs">{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={count ? "secondary" : "muted"}>
                  {count} listing{count === 1 ? "" : "s"}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {CATEGORIES.map((category) => {
        const jobs = bySource.get(category.source) ?? [];
        if (!jobs.length) return null;
        const ranked = [...jobs].sort(
          (a, b) => (matchMap.get(b.id)?.score ?? 0) - (matchMap.get(a.id)?.score ?? 0),
        );

        return (
          <section key={category.source} className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <category.icon className="size-4 text-primary" />
                  {category.title}
                  <Badge variant="muted">{jobs.length}</Badge>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/jobs?sources=${category.source}`}>
                  Open in jobs page <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {ranked.slice(0, 3).map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  match={matchMap.get(job.id)}
                  index={index}
                  saved={savedIds.has(job.id)}
                  applied={workspace.applications.some(
                    (a) => a.jobId === job.id && a.status !== "SAVED",
                  )}
                />
              ))}
            </div>

            {ranked.length > 3 && (
              <p className="text-xs text-muted-foreground">
                Showing the 3 best matches of {ranked.length} in this category ·{" "}
                <Link href="/jobs" className="text-primary hover:underline">
                  see all
                </Link>
              </p>
            )}
          </section>
        );
      })}

      {/* ----------------------------- programmes ---------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <GraduationCap className="size-4 text-primary" />
            Skill development programmes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Free or low-cost training run through the demo district skill network.
          </p>
        </div>

        {workspace.training.filter((t) => t.cost === 0).length === 0 ? (
          <EmptyState title="No free programmes in the current dataset" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspace.training
              .filter((t) => t.cost === 0)
              .slice(0, 6)
              .map((programme) => (
                <Card key={programme.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="success" className="text-[10px]">
                        Free
                      </Badge>
                      <Badge variant="muted" className="text-[10px]">
                        {labelEnum(programme.mode)}
                      </Badge>
                    </div>
                    <CardTitle className="mt-1 text-base leading-snug">{programme.title}</CardTitle>
                    <CardDescription>{programme.provider}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      {programme.durationWeeks} weeks · {programme.language} ·{" "}
                      {programme.cost === 0 ? "No fee" : formatINR(programme.cost)}
                    </p>
                    <p>
                      Location:{" "}
                      {programme.locationId ? locationById(programme.locationId).name : "Online / anywhere"}
                    </p>
                    <p className="text-[11px]">Target role: {programme.careerPath || "Multi-purpose"}</p>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link href="/training">Open learning path</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </section>

      <p className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-[11px] leading-relaxed text-secondary">
        <strong>Demonstration data.</strong> Programme names, departments and employers on this page are
        fictional and exist to exercise the matching engine. Nothing here represents a real government
        scheme or an open vacancy.
      </p>
    </div>
  );
}
