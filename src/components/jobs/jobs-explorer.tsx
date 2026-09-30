"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Briefcase, Sparkles, Target } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters, type JobFilterState } from "@/components/jobs/job-filters";
import { WhyMatchDialog } from "@/components/jobs/why-match";
import { ApplyWithAiDialog } from "@/components/jobs/apply-dialog";
import { EmptyState, Pagination } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoBadge } from "@/components/shared/brand";
import { filterJobs } from "@/lib/data/job-query";
import { SKILL_BY_ID } from "@/lib/data/catalogue";
import type { Application, Job, JobMatch, Location } from "@/types";

const PAGE_SIZE = 9;

/**
 * Job matching page.
 *
 * Filtering happens in the same pure module the API and the agent use, so a
 * filter applied here behaves identically to one applied through
 * POST /api/agent/search-jobs.
 */
export function JobsExplorer({
  jobs,
  matches,
  applications,
  locations,
  matchScore,
  defaultMaxDistanceKm,
  title = "Jobs Recommended For You",
  description,
}: {
  jobs: Job[];
  matches: Record<string, JobMatch>;
  applications: Application[];
  locations: Location[];
  matchScore: number;
  defaultMaxDistanceKm?: number;
  title?: string;
  description?: string;
}) {
  const [filters, setFilters] = React.useState<JobFilterState>({
    sort: "recent",
    page: 1,
    pageSize: PAGE_SIZE,
    maxDistanceKm: defaultMaxDistanceKm,
  });
  const [whyJobId, setWhyJobId] = React.useState<string | null>(null);
  const [applyJobId, setApplyJobId] = React.useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = React.useState(false);

  const filtered = React.useMemo(() => {
    const base = filterJobs(jobs, { ...filters, sort: "recent" }, undefined);
    const withScores = base.map((job) => ({ job, score: matches[job.id]?.score ?? 0 }));

    const constrained = onlyMissing
      ? withScores.filter(({ job }) => (matches[job.id]?.missingSkills.length ?? 0) > 0)
      : withScores;

    const sorted = [...constrained].sort((a, b) => {
      if (filters.sort === "salary") return (b.job.salaryMax ?? 0) - (a.job.salaryMax ?? 0);
      if (filters.sort === "relevance") return a.job.title.localeCompare(b.job.title);
      // Default: best AI match first, then newest.
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.job.postedAt).getTime() - new Date(a.job.postedAt).getTime();
    });

    return sorted.map((entry) => entry.job);
  }, [jobs, filters, matches, onlyMissing]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(filters.page ?? 1, totalPages);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const appliedIds = new Set(applications.filter((a) => a.status !== "SAVED").map((a) => a.jobId));
  const savedIds = new Set(applications.map((a) => a.jobId));

  const whyJob = whyJobId ? jobs.find((j) => j.id === whyJobId) : null;
  const applyJob = applyJobId ? jobs.find((j) => j.id === applyJobId) : null;

  const gapCount = React.useMemo(
    () => Object.values(matches).filter((m) => m.missingSkills.length > 0).length,
    [matches],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ??
              `Ranked by the matching engine using six weighted factors. Your average top-5 match score is ${matchScore}%.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1.5">
            <Sparkles className="size-3" />
            {matchScore}% AI match score
          </Badge>
          <Badge variant="warning" className="gap-1.5">
            <Target className="size-3" />
            {gapCount} jobs with skill gaps
          </Badge>
          <DemoBadge />
        </div>
      </header>

      <JobFilters
        value={filters}
        onChange={setFilters}
        locations={locations}
        resultCount={filtered.length}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={onlyMissing ? "default" : "outline"}
          onClick={() => setOnlyMissing((v) => !v)}
          aria-pressed={onlyMissing}
        >
          <Target className="size-3.5" />
          {onlyMissing ? "Showing jobs with skill gaps" : "Only jobs with skill gaps"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Tip: the “Why This Match?” button shows exactly how each score was calculated.
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="No jobs match these filters"
          description="Try widening the distance, removing a skill, or clearing the salary filter. The demo dataset has 40+ postings across Odisha and Jharkhand."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setOnlyMissing(false);
                setFilters({ sort: "recent", page: 1, pageSize: PAGE_SIZE });
              }}
            >
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              match={matches[job.id]}
              applied={appliedIds.has(job.id)}
              saved={savedIds.has(job.id)}
              index={index}
              onWhyMatch={() => setWhyJobId(job.id)}
              onApply={() => setApplyJobId(job.id)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(next) => {
            setFilters((current) => ({ ...current, page: next }));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {whyJob && matches[whyJob.id] && (
        <WhyMatchDialog
          job={whyJob}
          match={matches[whyJob.id]}
          open={Boolean(whyJobId)}
          onOpenChange={(open) => !open && setWhyJobId(null)}
          onStartLearning={() => {
            setWhyJobId(null);
            window.location.href = `/training?targetJobId=${whyJob.id}`;
          }}
        />
      )}

      {applyJob && (
        <ApplyWithAiDialog
          job={applyJob}
          match={matches[applyJob.id] ?? null}
          open={Boolean(applyJobId)}
          onOpenChange={(open) => !open && setApplyJobId(null)}
          alreadyApplied={appliedIds.has(applyJob.id)}
        />
      )}

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-xs leading-relaxed text-secondary"
      >
        All postings, employers and salaries on this page are fictional demo records created for this
        academic prototype. Skill names come from the shared skill catalogue (
        {SKILL_BY_ID.size} skills) used by the matcher, the gap engine and the agent.
      </motion.p>
    </div>
  );
}
