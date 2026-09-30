import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Clock,
  GraduationCap,
  IndianRupee,
  Languages,
  MapPin,
  Route,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState, Separator } from "@/components/ui/misc";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { ProgressBar } from "@/components/shared/metrics";
import { EnrollButton } from "@/components/training/enroll-button";
import { locationById } from "@/lib/data/catalogue";
import { formatINR, labelEnum } from "@/lib/utils";
import { requireWorkspace } from "@/lib/server/workspace";

export const metadata: Metadata = { title: "Training & Learning Path" };

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ skillId?: string; targetJobId?: string }>;
}) {
  const { skillId } = await searchParams;
  const workspace = await requireWorkspace();
  const { learningPath, skillGapReport, training, userTraining, profile } = workspace;

  const enrolledById = new Map(userTraining.map((record) => [record.trainingId, record]));
  const focusSkill = skillId ? skillGapReport.gaps.find((g) => g.skillId === skillId) : null;

  const filteredCatalogue = skillId
    ? training.filter((programme) => programme.skillIds.includes(skillId))
    : training;

  const overallProgress = learningPath.steps.length
    ? Math.round(
        learningPath.steps.reduce(
          (sum, step) => sum + (enrolledById.get(step.training.id)?.progress ?? 0),
          0,
        ) / learningPath.steps.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {focusSkill ? `Training for ${focusSkill.skillName}` : "Your AI Learning Path"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Built from the skill gaps detected against your target role. Steps are ordered so quick wins come
            first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3" />
            Projected match score {learningPath.projectedMatchScore}%
          </Badge>
          <DemoBadge />
        </div>
      </header>

      {/* ------------------------------ path summary ----------------------- */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="size-4 text-primary" />
              Learning path for “{learningPath.careerGoal}”
            </CardTitle>
            <CardDescription>
              {learningPath.steps.length} steps · about {learningPath.totalWeeks} weeks of part-time study
              {learningPath.targetJob ? ` · target role: ${learningPath.targetJob.title}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {learningPath.steps.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="size-5" />}
                title="No learning path yet"
                description="Add skills and a career goal to your profile, then we can build a path."
                action={
                  <Button asChild size="sm">
                    <Link href="/onboarding">Complete profile</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Overall path progress</span>
                    <span className="font-semibold tabular-nums">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="mt-1.5" />
                </div>

                <ol className="space-y-3">
                  {learningPath.steps.map((step) => {
                    const record = enrolledById.get(step.training.id);
                    const progress = record?.progress ?? 0;
                    return (
                      <li key={step.training.id} className="rounded-xl border border-border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {step.order}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium leading-tight">{step.training.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {step.training.provider}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {record && (
                              <Badge
                                variant={record.status === "COMPLETED" ? "success" : "secondary"}
                                className="text-[10px]"
                              >
                                {labelEnum(record.status)}
                              </Badge>
                            )}
                            <Badge variant="muted" className="gap-1 text-[10px]">
                              <Clock className="size-2.5" /> {step.weeks} wk
                            </Badge>
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">{step.reason}</p>

                        {step.coversGaps.length > 0 && (
                          <p className="mt-1.5 text-[11px] text-primary">
                            Closes: {step.coversGaps.join(", ")}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="min-w-32 flex-1">
                            <ProgressBar value={progress} tone={progress === 100 ? "success" : "primary"} />
                          </div>
                          <span className="text-[11px] tabular-nums text-muted-foreground">{progress}%</span>
                          <EnrollButton trainingId={step.training.id} status={record?.status ?? null} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-secondary" />
                What this path changes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gaps before</span>
                <span className="font-semibold">{skillGapReport.gaps.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Required-skill coverage</span>
                <span className="font-semibold">{skillGapReport.coverage}%</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated score after completion</span>
                <span className="font-display text-lg font-bold text-success">
                  {learningPath.projectedMatchScore}%
                </span>
              </div>
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Projection is a model estimate based on how much each remaining gap costs you in the match
                score. It is not a guarantee of selection.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/skill-gaps">
                  Review my gaps <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your training records</CardTitle>
              <CardDescription>
                {userTraining.length} programme{userTraining.length === 1 ? "" : "s"} linked to your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {userTraining.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  None yet — enrol in the first step of your path to start tracking progress.
                </p>
              ) : (
                userTraining.map((record) => {
                  const programme = training.find((t) => t.id === record.trainingId);
                  if (!programme) return null;
                  return (
                    <div key={record.id}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-medium">{programme.title}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{record.progress}%</span>
                      </div>
                      <ProgressBar
                        value={record.progress}
                        tone={record.status === "COMPLETED" ? "success" : "primary"}
                        className="mt-1.5"
                        height={6}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------ catalogue --------------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <BookOpen className="size-4" />
              {focusSkill ? `Programmes covering ${focusSkill.skillName}` : "All recommended programmes"}
              <AiTag>ranked by fit</AiTag>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredCatalogue.length} programmes in the demo catalogue. Most are free to enrol.
            </p>
          </div>
          {skillId && (
            <Button asChild variant="outline" size="sm">
              <Link href="/training">Show all programmes</Link>
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCatalogue.map((programme) => {
            const record = enrolledById.get(programme.id);
            const covering = programme.skillIds.filter((id) =>
              skillGapReport.gaps.some((gap) => gap.skillId === id),
            );
            return (
              <Card key={programme.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="muted" className="text-[10px]">
                      {labelEnum(programme.mode)}
                    </Badge>
                    {programme.cost === 0 && (
                      <Badge variant="success" className="text-[10px]">
                        Free
                      </Badge>
                    )}
                    {covering.length > 0 && (
                      <Badge variant="warning" className="text-[10px]">
                        Closes {covering.length} gap{covering.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-1 text-base leading-snug">{programme.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <BadgeCheck className="size-3.5 shrink-0" />
                    {programme.provider}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {programme.description}
                  </p>

                  <dl className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3" /> {programme.durationWeeks} weeks
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="size-3 text-warning" /> {programme.rating.toFixed(1)} rating
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Languages className="size-3" /> {programme.language}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-3" /> {programme.enrolments.toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="size-3" />
                      {programme.cost === 0 ? "No fee" : formatINR(programme.cost)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3" />
                      {programme.locationId ? locationById(programme.locationId).name : "Online"}
                    </div>
                  </dl>

                  <p className="text-[11px] text-muted-foreground">
                    Certificate: {programme.certification || "Course completion"}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <EnrollButton
                      trainingId={programme.id}
                      status={record?.status ?? null}
                      className="flex-1"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 text-[11px] leading-relaxed text-secondary">
        Demo catalogue: providers, ratings, enrolment counts and certification names are fictional. Programme
        durations are also used by the skill-gap engine to estimate learning time for{" "}
        {profile.skills.length} skills.
      </p>
    </div>
  );
}
