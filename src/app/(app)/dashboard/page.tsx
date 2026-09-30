import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CalendarClock,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState, Separator } from "@/components/ui/misc";
import { ProgressBar, StatCard } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { JobCard } from "@/components/jobs/job-card";
import { Greeting } from "@/components/dashboard/greeting";
import {
  ApplicationStatusChart,
  CareerProgressChart,
  SkillDistributionChart,
  TrainingProgressList,
} from "@/components/dashboard/charts";
import { decorateSkills, requireWorkspace } from "@/lib/server/workspace";
import { formatDate, labelEnum, relativeDays } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const workspace = await requireWorkspace();
  const {
    profile,
    matches,
    skillGapReport,
    learningPath,
    applications,
    userTraining,
    training,
    profileCompletion,
    matchScore,
  } = workspace;

  const topMatch = matches[0] ?? null;
  const topGaps = skillGapReport.gaps.slice(0, 4);
  const activeApplications = applications.filter((a) => a.status !== "SAVED");
  const upcomingInterview = applications
    .filter((a) => a.interviewAt && new Date(a.interviewAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.interviewAt!).getTime() - new Date(b.interviewAt!).getTime())[0];

  const enrolledTraining = userTraining
    .map((record) => {
      const programme = training.find((t) => t.id === record.trainingId);
      return programme ? { title: programme.title, progress: record.progress, status: labelEnum(record.status) } : null;
    })
    .filter((item): item is { title: string; progress: number; status: string } => Boolean(item));

  /**
   * Career-progress series.
   * "Now" is the real computed match score; the following points are the model's
   * projection after each learning-path step. Labelled as a projection in the UI.
   */
  const careerPoints = [
    { label: "Now", matchScore: matchScore, skills: profile.skills.length },
    ...learningPath.steps.slice(0, 4).map((step, index, all) => {
      const uplift = Math.max(0, learningPath.projectedMatchScore - matchScore);
      const cumulative = Math.round((uplift * (index + 1)) / Math.max(all.length, 1));
      return {
        label: `Step ${index + 1}`,
        matchScore: Math.min(99, matchScore + cumulative),
        skills: profile.skills.length + index + 1,
      };
    }),
  ];

  const skillCategories = decorateSkills(profile);

  return (
    <div className="space-y-6">
      <Greeting
        name={profile.name}
        completion={profileCompletion}
        isAdmin={workspace.session.role === "ADMIN"}
        goal={profile.careerGoal}
      />

      {/* ------------------------------- stat row --------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="AI Match Score"
          value={matchScore}
          suffix="%"
          hint="Average of your top 5 matches"
          icon={<Sparkles />}
          tone="primary"
        />
        <StatCard
          label="Top Job Match"
          value={topMatch ? topMatch.score : 0}
          suffix="%"
          hint={topMatch ? topMatch.job.title : "Complete your profile"}
          icon={<Briefcase />}
          tone="secondary"
        />
        <StatCard
          label="Skill Gap"
          value={skillGapReport.gaps.length}
          hint={topGaps.length ? topGaps.map((g) => g.skillName).slice(0, 2).join(", ") : "No gaps detected"}
          icon={<Target />}
          tone="warning"
        />
        <StatCard
          label="Applications"
          value={activeApplications.length}
          hint={`${applications.length} total tracked`}
          icon={<FileText />}
          tone="success"
        />
        <StatCard
          label="Training"
          value={learningPath.steps.length}
          hint={`${enrolledTraining.filter((t) => t.status !== "Recommended").length} in progress`}
          icon={<GraduationCap />}
          tone="secondary"
        />
      </div>

      {/* --------------------------- upcoming actions ----------------------- */}
      {(upcomingInterview || profileCompletion < 100) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {upcomingInterview && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-start gap-3 pt-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Interview {relativeDays(upcomingInterview.interviewAt!)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {upcomingInterview.nextAction}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scheduled for {formatDate(upcomingInterview.interviewAt, true)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/applications">Prepare in tracker</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {profileCompletion < 100 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 pt-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
                  <TrendingUp className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Finish your profile to unlock better matches</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    You are at {profileCompletion}%. Adding education, preferences and more skills directly
                    improves your match ranking.
                  </p>
                  <Progress value={profileCompletion} className="mt-3" />
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/profile">Complete profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ------------------------------- charts ----------------------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <SkillDistributionChart
          skills={skillCategories.map((s) => ({
            skillId: s.skillId,
            name: s.name,
            proficiency: s.proficiency,
            category: s.category,
          }))}
        />
        <ApplicationStatusChart applications={applications} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Career goal &amp; plan</CardTitle>
            <CardDescription>What the assistant is optimising for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-xl bg-muted/60 px-3 py-3 text-sm leading-relaxed">
              “{profile.careerGoal || "No career goal set yet."}”
            </p>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Required skills covered</span>
                <span className="font-semibold tabular-nums">{skillGapReport.coverage}%</span>
              </div>
              <ProgressBar value={skillGapReport.coverage} tone="success" className="mt-1.5" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Path toward target score</span>
                <span className="font-semibold tabular-nums">
                  {matchScore}% → {learningPath.projectedMatchScore}%
                </span>
              </div>
              <ProgressBar
                value={(matchScore / Math.max(learningPath.projectedMatchScore, 1)) * 100}
                tone="primary"
                className="mt-1.5"
              />
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/skill-gaps">
                <Target className="size-3.5" />
                Open skill-gap analysis
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <CareerProgressChart points={careerPoints} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-secondary" />
              Training progress
            </CardTitle>
            <CardDescription>Your current learning path and its status.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledTraining.length ? (
              <TrainingProgressList items={enrolledTraining} />
            ) : (
              <EmptyState
                icon={<GraduationCap className="size-5" />}
                title="No training started"
                description="Your learning path is ready — enrol to start closing your top skill gaps."
                action={
                  <Button asChild size="sm">
                    <Link href="/training">View learning path</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        The “Career progress” chart shows your <strong>current</strong> computed match score followed by a
        model <strong>projection</strong> after each learning-path step. Projections are estimates, not
        guarantees.
      </p>

      {/* ---------------------------- recommendations ----------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Recommended for you</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by the matching engine from your skills, location and preferences.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/jobs">
              See all {matches.length} matches <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0, 3).map((match, index) => (
            <JobCard
              key={match.job.id}
              job={match.job}
              match={match}
              index={index}
              applied={applications.some((a) => a.jobId === match.job.id && a.status !== "SAVED")}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------- gaps + agent ----------------------- */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-warning" />
                Top skill gaps
              </CardTitle>
              <CardDescription>Ranked by how many of your matching jobs require them.</CardDescription>
            </div>
            <AiTag />
          </CardHeader>
          <CardContent className="space-y-3">
            {topGaps.length === 0 ? (
              <EmptyState
                icon={<Target className="size-5" />}
                title="No gaps detected"
                description="You currently satisfy every required skill in your top matching jobs."
              />
            ) : (
              topGaps.map((gap) => (
                <div key={gap.skillId} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{gap.skillName}</span>
                    <Badge variant={gap.importance === "REQUIRED" ? "destructive" : "warning"}>
                      {labelEnum(gap.importance)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{gap.rationale}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    ~{gap.estimatedWeeks} week{gap.estimatedWeeks > 1 ? "s" : ""} to learn ·{" "}
                    {gap.recommendedTraining.length} recommended programme
                    {gap.recommendedTraining.length === 1 ? "" : "s"}
                  </p>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/skill-gaps">Open full analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-secondary" />
              Ask the AI Job Assistant
            </CardTitle>
            <CardDescription>Your personal employment assistant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                "Find jobs near me",
                "Which job is best matched to my skills?",
                "What skills am I missing?",
                "Help me apply for this job",
              ].map((prompt) => (
                <li key={prompt} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2">
                  <Sparkles className="size-3 shrink-0 text-secondary" />
                  “{prompt}”
                </li>
              ))}
            </ul>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/agent">
                Open the assistant <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <DemoBadge long />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
