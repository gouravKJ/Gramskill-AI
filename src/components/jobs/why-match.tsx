"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, CheckCircle2, Info, ShieldCheck, Volume2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/misc";
import { ScoreRing } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { usePreferences } from "@/components/providers/app-providers";
import { locationById, SKILL_BY_ID } from "@/lib/data/catalogue";
import type { Job, JobMatch } from "@/types";
import { cn } from "@/lib/utils";

const FACTOR_TONE: Record<string, string> = {
  skills: "bg-primary",
  education: "bg-secondary",
  experience: "bg-chart-4",
  location: "bg-chart-3",
  preferences: "bg-chart-5",
  semantic: "bg-muted-foreground",
};

/**
 * The "Why This Match?" panel.
 *
 * This is the transparency contract of the product: a ranked result is never
 * shown without its reasons, its weighted factor breakdown and its gaps.
 */
export function WhyMatchDialog({
  job,
  match,
  open,
  onOpenChange,
  onStartLearning,
}: {
  job: Job;
  match: JobMatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartLearning?: () => void;
}) {
  const { prefs, toggle } = usePreferences();
  const simple = prefs.simpleLanguage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Why we recommend this job
            <AiTag />
          </DialogTitle>
          <DialogDescription>
            {job.title} · {job.company} · {locationById(job.locationId).name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={match.score} size={112} label="Match score" className="mx-auto sm:mx-0" />
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed">{match.explanation.summary}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggle("simpleLanguage")}
                aria-pressed={simple}
              >
                <Volume2 className="size-3.5" />
                {simple ? "Show standard explanation" : "Explain in Simple Language"}
              </Button>
            </div>
          </div>
        </div>

        {simple && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-sm leading-relaxed">{match.explanation.simple}</p>
          </div>
        )}

        <Separator />

        {/* -------------------------- factor breakdown ------------------------ */}
        <section aria-labelledby="factors-heading">
          <h3 id="factors-heading" className="text-sm font-semibold">
            How the score is calculated
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Each factor is scored 0–100 and weighted; the weighted sum becomes your match score.
          </p>
          <ul className="mt-3 space-y-3">
            {match.factors.map((factor, index) => (
              <li key={factor.key}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium">
                    {factor.label}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      ({(factor.weight * 100).toFixed(0)}% weight)
                    </span>
                  </span>
                  <span className="tabular-nums font-semibold">{Math.round(factor.score * 100)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", FACTOR_TONE[factor.key] ?? "bg-primary")}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(factor.score * 100)}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{factor.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="size-4" /> What works in your favour
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {match.explanation.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-success" aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-warning">
              <AlertTriangle className="size-4" /> Skill gaps
            </h3>
            {match.missingSkills.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                None — you cover every skill listed for this role.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {job.skills
                  .filter((s) => match.missingSkills.includes(SKILL_BY_ID.get(s.skillId)?.name ?? ""))
                  .map((s) => {
                    const skill = SKILL_BY_ID.get(s.skillId);
                    return (
                      <li key={s.skillId} className="flex items-start justify-between gap-2 text-xs">
                        <span className="font-medium">⚠ {skill?.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {skill?.learningWeeks} wk · {s.importance.toLowerCase()}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
            {match.partialSkills.length > 0 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Partially covered (below the expected level): {match.partialSkills.join(", ")}
              </p>
            )}
          </section>
        </div>

        {match.explanation.suggestions.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <h3 className="text-sm font-semibold">What to do next</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {match.explanation.suggestions.map((suggestion) => (
                <li key={suggestion} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {suggestion}
                </li>
              ))}
            </ul>
            {onStartLearning && (
              <Button size="sm" className="mt-3" onClick={onStartLearning}>
                <BookOpen className="size-3.5" />
                Start Learning Path
              </Button>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-dashed border-secondary/40 bg-secondary/5 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-secondary" />
          <p className="text-[11px] leading-relaxed text-secondary">
            This explanation is generated from your profile and the posting's requirements by the matching
            engine — it is not a claim from the employer about your chances.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Compact inline variant used on the job detail page. */
export function MatchFactorList({ match }: { match: JobMatch }) {
  return (
    <ul className="space-y-2.5">
      {match.factors.map((factor) => (
        <li key={factor.key} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs font-medium">{factor.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.span
              className={cn("block h-full rounded-full", FACTOR_TONE[factor.key] ?? "bg-primary")}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(factor.score * 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </span>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums">
            {Math.round(factor.score * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function ImportanceBadge({ importance }: { importance: string }) {
  return (
    <Badge
      variant={importance === "REQUIRED" ? "destructive" : importance === "PREFERRED" ? "warning" : "muted"}
      className="text-[10px]"
    >
      {importance.toLowerCase()}
    </Badge>
  );
}
