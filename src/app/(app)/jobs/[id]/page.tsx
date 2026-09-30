import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs, Separator } from "@/components/ui/misc";
import { MatchBadge, ProgressBar, ScoreRing, SkillChip } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { JobCard } from "@/components/jobs/job-card";
import { ImportanceBadge, MatchFactorList } from "@/components/jobs/why-match";
import { JobDetailActions } from "@/components/jobs/job-detail-actions";
import { matchJob } from "@/lib/ai/match-engine";
import { locationById, skillName } from "@/lib/data/catalogue";
import { formatDate, formatSalaryRange, labelEnum, relativeDays } from "@/lib/utils";
import { requireWorkspace } from "@/lib/server/workspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const workspace = await requireWorkspace();
  const job = workspace.jobs.find((j) => j.id === id);
  return { title: job ? `${job.title} · ${job.company}` : "Job not found" };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await requireWorkspace();

  const job = workspace.jobs.find((j) => j.id === id);
  if (!job) notFound();

  const match = matchJob(workspace.profile, job, { corpus: workspace.jobs });
  const location = locationById(job.locationId);
  const application = workspace.applications.find((a) => a.jobId === job.id);
  const applied = Boolean(application && application.status !== "SAVED");
  const saved = Boolean(application);

  // Similar roles: same sector or overlapping skills, excluding this one.
  const similar = workspace.matches
    .filter((m) => m.job.id !== job.id)
    .filter(
      (m) =>
        m.job.sector === job.sector ||
        m.job.skills.some((s) => job.skills.some((js) => js.skillId === s.skillId)),
    )
    .slice(0, 3);

  const matchedNames = new Set([...match.matchedSkills, ...match.partialSkills]);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Jobs", href: "/jobs" }, { label: job.title }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* -------------------------------- main --------------------------- */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{labelEnum(job.source)}</Badge>
                    {job.workMode === "REMOTE" && (
                      <Badge variant="secondary" className="gap-1">
                        <Wifi className="size-3" /> Remote
                      </Badge>
                    )}
                    {job.isRuralFriendly && <Badge variant="success">Rural-friendly employer</Badge>}
                    <DemoBadge />
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {job.title}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="size-4" />
                    {job.company}
                    <span aria-hidden>·</span>
                    {job.companyType}
                  </p>
                </div>
                <MatchBadge score={match.score} className="text-sm" />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {location.name}
                    {match.distanceKm != null && (
                      <span className="text-xs text-muted-foreground">({match.distanceKm} km)</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Salary</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-medium">
                    <Wallet className="size-3.5 text-muted-foreground" />
                    {formatSalaryRange(job.salaryMin, job.salaryMax)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Openings</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-medium">
                    <Users className="size-3.5 text-muted-foreground" />
                    {job.openings}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Job type</dt>
                  <dd className="mt-1 font-medium">{labelEnum(job.jobType)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Experience</dt>
                  <dd className="mt-1 font-medium">{labelEnum(job.experienceRequired)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Education</dt>
                  <dd className="mt-1 font-medium">{labelEnum(job.educationRequired)}</dd>
                </div>
              </dl>

              <Separator className="my-5" />

              <div className="grid gap-3 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  Posted {formatDate(job.postedAt)} ·{" "}
                  <span className="font-medium text-warning">
                    closes {formatDate(job.deadline)} ({relativeDays(job.deadline)})
                  </span>
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  {job.contactEmail}
                </p>
              </div>

              <div className="mt-5">
                <JobDetailActions job={job} match={match} applied={applied} saved={saved} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About this role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <p className="leading-relaxed text-muted-foreground">{job.description}</p>

              <div>
                <h3 className="font-display text-sm font-semibold">Requirements</h3>
                <ul className="mt-2 space-y-1.5">
                  {job.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-2 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold">Responsibilities</h3>
                <ul className="mt-2 space-y-1.5">
                  {job.responsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex gap-2 text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Skills this job needs
                <AiTag>compared with your profile</AiTag>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="divide-y divide-border">
                {job.skills.map((requirement) => {
                  const name = skillName(requirement.skillId);
                  const state = match.matchedSkills.includes(name)
                    ? "have"
                    : match.partialSkills.includes(name)
                      ? "partial"
                      : "missing";
                  return (
                    <li key={requirement.skillId} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className="min-w-40 flex-1 text-sm font-medium">{name}</span>
                      <ImportanceBadge importance={requirement.importance} />
                      <SkillChip name={labelEnum(requirement.minProficiency)} state={state} className="text-[10px]" />
                      <span className="w-24 text-right text-[11px] text-muted-foreground">
                        {state === "have" ? "You have this" : state === "partial" ? "Below level" : "Missing"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {match.missingSkills.length > 0 ? (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <p className="text-sm font-medium text-warning">
                    {match.missingSkills.length} skill{match.missingSkills.length > 1 ? "s" : ""} to close:{" "}
                    {match.missingSkills.join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The training page builds a step-by-step learning path for exactly these gaps.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href={`/training?targetJobId=${job.id}`}>
                      <Sparkles className="size-3.5" />
                      View my learning path
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm text-success">
                  You already cover every skill listed for this role.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------- sidebar ------------------------- */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Why this match
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <ScoreRing score={match.score} size={124} label="AI match" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{match.explanation.summary}</p>
              <Separator />
              <MatchFactorList match={match} />
              <p className="text-[11px] text-muted-foreground">
                Weights: skills 42% · location 16% · education 14% · experience 12% · preferences 10% ·
                similarity 6%.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {application ? (
                <>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCheck className="size-3.5" />
                    Status
                  </p>
                  <Badge variant={application.status === "REJECTED" ? "destructive" : "success"}>
                    {labelEnum(application.status)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Applied {formatDate(application.appliedAt)}.
                    {application.interviewAt && (
                      <>
                        {" "}
                        Interview on <strong className="text-foreground">{formatDate(application.interviewAt)}</strong>.
                      </>
                    )}
                  </p>
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Next action: {application.nextAction}
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/applications">Open tracker</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    You have not applied yet. “Apply with AI” drafts the application, highlights missing
                    information and waits for your confirmation before anything is recorded.
                  </p>
                  <ProgressBar value={match.score} tone="primary" />
                  <p className="text-[11px] text-muted-foreground">
                    Closing the {match.missingSkills.length} missing skill
                    {match.missingSkills.length === 1 ? "" : "s"} would raise this score.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-secondary" />
                Rural-first details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                {job.isRuralFriendly
                  ? "This employer explicitly hires candidates from rural areas."
                  : "No explicit rural hiring note from this employer."}
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                {job.localLanguageSupport
                  ? "Workplace supports local-language communication."
                  : "Local language support not mentioned."}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {job.workMode === "REMOTE"
                  ? "Remote — you can work from your village."
                  : `About ${match.distanceKm ?? "—"} km from your saved location.`}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold">Similar opportunities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Same sector or overlapping skills, ranked for your profile.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((entry, index) => (
              <JobCard key={entry.job.id} job={entry.job} match={entry} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
