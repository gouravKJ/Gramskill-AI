"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  MapPin,
  Sparkles,
  Wallet,
  Wifi,
  HelpCircle,
  Send,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchBadge, SkillChip } from "@/components/shared/metrics";
import { DemoBadge } from "@/components/shared/brand";
import { formatDate, formatSalaryRange, relativeDays } from "@/lib/utils";
import { locationById, SKILL_BY_ID } from "@/lib/data/catalogue";
import type { Job, JobMatch } from "@/types";
import { cn } from "@/lib/utils";

const SOURCE_LABEL: Record<Job["source"], string> = {
  PRIVATE: "Private",
  GOVERNMENT: "Government",
  APPRENTICESHIP: "Apprenticeship",
  SKILL_DEVELOPMENT: "Skill development",
  SELF_EMPLOYMENT: "Self-employment",
  LOCAL: "Local employer",
};

export function JobCard({
  job,
  match,
  applied,
  saved,
  onWhyMatch,
  onApply,
  index = 0,
  compact = false,
}: {
  job: Job;
  match?: JobMatch | null;
  applied?: boolean;
  saved?: boolean;
  onWhyMatch?: () => void;
  onApply?: () => void;
  index?: number;
  compact?: boolean;
}) {
  const location = locationById(job.locationId);
  const closingSoon = new Date(job.deadline).getTime() - Date.now() < 5 * 86_400_000;

  const skillStates = job.skills.slice(0, compact ? 4 : 7).map((requirement) => {
    const name = SKILL_BY_ID.get(requirement.skillId)?.name ?? requirement.skillId;
    const state = !match
      ? ("unknown" as const)
      : match.matchedSkills.includes(name)
        ? ("have" as const)
        : match.partialSkills.includes(name)
          ? ("partial" as const)
          : ("missing" as const);
    return { name, state, importance: requirement.importance };
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="group h-full"
    >
      <Card className="flex h-full flex-col transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]">
        <CardContent className="flex flex-1 flex-col gap-3.5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="muted" className="text-[10px]">
                  {SOURCE_LABEL[job.source]}
                </Badge>
                {job.workMode === "REMOTE" && (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Wifi className="size-2.5" /> Remote
                  </Badge>
                )}
                {applied && (
                  <Badge variant="success" className="text-[10px]">
                    Applied
                  </Badge>
                )}
                {saved && !applied && (
                  <Badge variant="outline" className="text-[10px]">
                    Saved
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 truncate font-display text-base font-semibold leading-tight">
                <Link href={`/jobs/${job.id}`} className="transition-colors hover:text-primary">
                  {job.title}
                </Link>
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                {job.company}
              </p>
            </div>
            {match && <MatchBadge score={match.score} className="shrink-0" />}
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {location.name}
                {match?.distanceKm != null && ` · ${match.distanceKm} km`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="size-3.5 shrink-0" />
              <span className="truncate">{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5 shrink-0" />
              <span className="truncate">
                {job.openings} opening{job.openings > 1 ? "s" : ""} · {job.jobType.toLowerCase().replace("_", " ")}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5",
                closingSoon ? "font-medium text-warning" : "text-muted-foreground",
              )}
            >
              <CalendarClock className="size-3.5 shrink-0" />
              <span className="truncate">
                {closingSoon ? `Closes ${relativeDays(job.deadline)}` : `Closes ${formatDate(job.deadline)}`}
              </span>
            </div>
          </dl>

          <div className="flex flex-wrap gap-1.5">
            {skillStates.map((skill) => (
              <SkillChip
                key={skill.name}
                name={skill.name}
                state={skill.state}
                title={`${skill.importance.toLowerCase()} for this role`}
              />
            ))}
            {job.skills.length > skillStates.length && (
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                +{job.skills.length - skillStates.length} more
              </span>
            )}
          </div>

          {match && match.missingSkills.length > 0 && (
            <p className="rounded-lg bg-warning/8 px-3 py-2 text-[11px] leading-relaxed text-warning">
              Skill gap: <strong>{match.missingSkills.slice(0, 3).join(", ")}</strong> — training is available
              for these.
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-none">
              <Link href={`/jobs/${job.id}`}>View Job</Link>
            </Button>
            {onWhyMatch && (
              <Button size="sm" variant="subtle" onClick={onWhyMatch} className="flex-1 sm:flex-none">
                <HelpCircle className="size-3.5" />
                Why This Match?
              </Button>
            )}
            {onApply && (
              <Button size="sm" onClick={onApply} disabled={applied} className="flex-1 sm:flex-none">
                <Sparkles className="size-3.5" />
                {applied ? "Applied" : "Apply with AI"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}

export function JobCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex justify-between">
            <div className="skeleton-shimmer h-4 w-40 rounded" />
            <div className="skeleton-shimmer h-6 w-20 rounded-full" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="skeleton-shimmer h-3 w-28 rounded" />
            <div className="skeleton-shimmer h-3 w-36 rounded" />
          </div>
        </Card>
      ))}
    </>
  );
}

export function DemoJobNote() {
  return (
    <div className="flex items-center gap-2">
      <DemoBadge />
      <span className="text-[11px] text-muted-foreground">
        Fictional employer — created for this academic demonstration.
      </span>
    </div>
  );
}

export { Send };
