import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/misc";
import { ProgressBar, ScoreRing, SkillChip } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { decorateSkills, requireWorkspace } from "@/lib/server/workspace";
import { formatINR, labelEnum } from "@/lib/utils";

export const metadata: Metadata = { title: "Skill Gap Analysis" };

export default async function SkillGapsPage() {
  const workspace = await requireWorkspace();
  const { skillGapReport, learningPath, profile } = workspace;

  const current = decorateSkills(profile);
  const missingIds = new Set(skillGapReport.gaps.map((g) => g.skillId));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Your Skill Gap Analysis</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            We compared your profile against the requirements of the jobs that fit you best
            {skillGapReport.targetJob ? (
              <>
                {" "}
                — target role: <strong className="text-foreground">{skillGapReport.targetJob.title}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="gap-1.5">
            <AlertTriangle className="size-3" />
            {skillGapReport.gaps.length} gap{skillGapReport.gaps.length === 1 ? "" : "s"}
          </Badge>
          <DemoBadge />
        </div>
      </header>

      {/* ------------------------------- overview ---------------------------- */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-primary" />
              Required-skill coverage
            </CardTitle>
            <CardDescription>
              Share of mandatory skills you already satisfy for your top matching roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ScoreRing score={skillGapReport.coverage} size={132} label="Coverage" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-muted/60 p-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Current skills</dt>
                <dd className="mt-0.5 font-display text-lg font-bold">{current.length}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Weeks to close top 3
                </dt>
                <dd className="mt-0.5 font-display text-lg font-bold">
                  {skillGapReport.estimatedWeeksToClose}
                </dd>
              </div>
            </dl>
            <Button asChild className="w-full">
              <Link href="/training">
                <GraduationCap className="size-4" />
                Start Learning Path
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-success">
                <CheckCircle2 className="size-4" />
                Current skills
              </CardTitle>
              <CardDescription>What employers can already rely on.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {current.length ? (
                current.map((skill) => (
                  <SkillChip
                    key={skill.skillId}
                    name={skill.name}
                    state="have"
                    title={`${labelEnum(skill.proficiency)} · ${skill.category}`}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills added yet.{" "}
                  <Link href="/onboarding" className="text-primary hover:underline">
                    Add skills
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-warning">
                <AlertTriangle className="size-4" />
                Missing skills
              </CardTitle>
              <CardDescription>Ranked by how many of your matches need them.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {skillGapReport.gaps.length ? (
                skillGapReport.gaps.map((gap) => (
                  <SkillChip key={gap.skillId} name={gap.skillName} state="missing" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No gaps detected — you cover everything your matches require.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ----------------------------- required skills ---------------------- */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Required skills across your top matches
              <AiTag>demand-weighted</AiTag>
            </CardTitle>
            <CardDescription>
              A skill marked REQUIRED by your best match outranks one that is only optional elsewhere.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {skillGapReport.requiredSkills.map((skill) => (
              <SkillChip
                key={skill.skillId}
                name={skill.name}
                state={missingIds.has(skill.skillId) ? "missing" : "have"}
                title={`${labelEnum(skill.importance)} · ${skill.category}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------- gaps ----------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Closing each gap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Importance, realistic learning time and the training we would recommend for every missing skill.
          </p>
        </div>

        {skillGapReport.gaps.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nothing to close right now. Re-run this page after you change your career goal.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {skillGapReport.gaps.map((gap) => (
              <Card key={gap.skillId} className="flex flex-col">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{gap.skillName}</CardTitle>
                    <CardDescription>{gap.category}</CardDescription>
                  </div>
                  <Badge variant={gap.importance === "REQUIRED" ? "destructive" : "warning"}>
                    {labelEnum(gap.importance)}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{gap.rationale}</p>

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/60 p-2">
                      <dt className="text-[10px] uppercase text-muted-foreground">Learning time</dt>
                      <dd className="mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold">
                        <Clock className="size-3" />
                        {gap.estimatedWeeks} wk
                      </dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <dt className="text-[10px] uppercase text-muted-foreground">Needed by</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{gap.demandedBy.length} jobs</dd>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2">
                      <dt className="text-[10px] uppercase text-muted-foreground">Training</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{gap.recommendedTraining.length}</dd>
                    </div>
                  </dl>

                  {gap.recommendedTraining.length > 0 && (
                    <ul className="space-y-2">
                      {gap.recommendedTraining.slice(0, 2).map((programme) => (
                        <li
                          key={programme.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border p-2.5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium">{programme.title}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {programme.provider} · {programme.durationWeeks} weeks ·{" "}
                              {programme.cost === 0 ? "Free" : formatINR(programme.cost)}
                            </span>
                          </span>
                          <Badge variant={programme.cost === 0 ? "success" : "muted"} className="shrink-0">
                            {programme.cost === 0 ? "Free" : "Paid"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Your progress on this skill</span>
                      <span>0%</span>
                    </div>
                    <ProgressBar value={0} tone="warning" className="mt-1.5" />
                    <Button asChild size="sm" className="mt-3 w-full">
                      <Link href={`/training?skillId=${gap.skillId}`}>
                        <Sparkles className="size-3.5" />
                        Start Learning Path
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------ learning path ----------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-secondary" />
            Recommended order to learn
          </CardTitle>
          <CardDescription>
            {learningPath.steps.length} steps · about {learningPath.totalWeeks} weeks · projected match score
            after completion: {learningPath.projectedMatchScore}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learningPath.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No learning path needed for your current target.
            </p>
          ) : (
            <>
              <ol className="space-y-2.5">
                {learningPath.steps.slice(0, 5).map((step) => (
                  <li key={step.training.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {step.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{step.training.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{step.reason}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{step.weeks} wk</span>
                  </li>
                ))}
              </ol>
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full">
                <Link href="/training">
                  Open the full learning path <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
