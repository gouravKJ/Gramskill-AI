"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox, EmptyState, Separator } from "@/components/ui/misc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { FunnelChart } from "@/components/dashboard/charts";
import { locationById } from "@/lib/data/catalogue";
import { formatDate, formatINR, labelEnum } from "@/lib/utils";
import type { ApiResult } from "@/lib/api/http";
import type { Analytics } from "@/lib/server/analytics";
import type { EducationLevel, ExperienceLevel, JobType, Location, Skill, WorkMode } from "@/types";

interface AdminJobRow {
  id: string;
  title: string;
  company: string;
  locationId: string;
  openings: number;
  deadline: string;
  source: string;
  sector: string;
}

interface AdminTrainingRow {
  id: string;
  title: string;
  provider: string;
  durationWeeks: number;
  cost: number;
  enrolments: number;
}

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  name: string;
  locationId: string;
  education: string | null;
  skills: number;
  completion: boolean;
  createdAt: string;
}

export function AdminPanel({
  analytics,
  users,
  jobs,
  training,
  skills,
  locations,
}: {
  analytics: Analytics;
  users: AdminUserRow[];
  jobs: AdminJobRow[];
  training: AdminTrainingRow[];
  skills: Skill[];
  locations: Location[];
}) {
  const router = useRouter();

  const skillCategories = React.useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const skill of skills) map.set(skill.category, [...(map.get(skill.category) ?? []), skill]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [skills]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Platform overview, moderation and dataset management. All figures are aggregated from live records.
          </p>
        </div>
        <DemoBadge />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total users" value={analytics.totals.users} icon={<Users />} tone="primary" />
        <StatCard
          label="Active job seekers"
          value={analytics.totals.seekers}
          icon={<Target />}
          tone="secondary"
        />
        <StatCard
          label="Jobs"
          value={analytics.totals.jobs}
          icon={<Briefcase />}
          tone="success"
          hint={`${analytics.totals.openJobs} currently open`}
        />
        <StatCard
          label="Applications"
          value={analytics.totals.applications}
          icon={<BarChart3 />}
          tone="warning"
        />
        <StatCard
          label="Training programmes"
          value={analytics.totals.trainings}
          icon={<GraduationCap />}
          tone="primary"
          hint={`${analytics.totals.trainingEnrolments} enrolments`}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="training">Training ({training.length})</TabsTrigger>
          <TabsTrigger value="skills">Skill categories</TabsTrigger>
        </TabsList>

        {/* ----------------------------- overview ---------------------------- */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FunnelChart
              data={analytics.applicationFunnel.map((stage) => ({
                label: stage.label,
                count: stage.count,
              }))}
              title="Application funnel"
              description={`${analytics.totals.applications} applications across the whole platform.`}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Users by location</CardTitle>
                <CardDescription>Where seeker demand is concentrated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.usersByLocation.slice(0, 8).map((entry) => {
                  const max = analytics.usersByLocation[0]?.count || 1;
                  return (
                    <div key={entry.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{entry.label}</span>
                        <span className="tabular-nums text-muted-foreground">{entry.count}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${(entry.count / max) * 100}%` }}
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
                <CardTitle className="text-base">Most demanded jobs</CardTitle>
                <CardDescription>By number of postings carrying that title.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {analytics.demandedJobs.slice(0, 8).map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{entry.label}</span>
                    <Badge variant="muted">{entry.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Popular skills (users)</CardTitle>
                <CardDescription>What seekers say they can already do.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {analytics.popularSkills.slice(0, 8).map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{entry.label}</span>
                    <Badge variant="secondary">{entry.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skill gaps across users</CardTitle>
                <CardDescription>What training to prioritise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {analytics.skillGapDemand.slice(0, 8).map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{entry.label}</span>
                    <Badge variant="warning">{entry.count}</Badge>
                  </div>
                ))}
                {analytics.skillGapDemand.length === 0 && (
                  <p className="text-xs text-muted-foreground">No gaps recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" />
                  Application conversion
                </CardTitle>
                <CardDescription>
                  {analytics.totals.applications} applications · interview-or-better rate{" "}
                  {analytics.interviewRate}%.
                </CardDescription>
              </div>
              <AiTag>computed from live records</AiTag>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {analytics.applicationFunnel.map((stage) => (
                  <div key={stage.key} className="rounded-xl border border-border p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stage.label}</p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums">{stage.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------- jobs ------------------------------ */}
        <TabsContent value="jobs" className="space-y-5">
          <CreateJobForm skills={skills} locations={locations} onCreated={() => router.refresh()} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job postings ({jobs.length})</CardTitle>
              <CardDescription>Update or add postings to the dataset.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Company</th>
                    <th className="py-2 pr-4 font-medium">Location</th>
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 pr-4 font-medium">Openings</th>
                    <th className="py-2 pr-4 font-medium">Closes</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 40).map((job) => (
                    <tr key={job.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{job.title}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{job.company}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {locationById(job.locationId).name}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="muted" className="text-[10px]">
                          {labelEnum(job.source)}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">{job.openings}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(job.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------- users ----------------------------- */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered users ({users.length})</CardTitle>
              <CardDescription>
                Demo accounts are seeded by <code className="font-mono text-xs">npm run db:seed</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {users.length === 0 ? (
                <EmptyState title="No users yet" />
              ) : (
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 pr-4 font-medium">Location</th>
                      <th className="py-2 pr-4 font-medium">Education</th>
                      <th className="py-2 pr-4 font-medium">Skills</th>
                      <th className="py-2 pr-4 font-medium">Onboarded</th>
                      <th className="py-2 pr-4 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-4 font-medium">{user.name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{user.email}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant={user.role === "ADMIN" ? "secondary" : "muted"} className="text-[10px]">
                            {user.role === "ADMIN" ? "Admin" : "Seeker"}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {user.locationId ? locationById(user.locationId).name : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {user.education ? labelEnum(user.education) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{user.skills}</td>
                        <td className="py-2.5 pr-4">
                          {user.completion ? (
                            <Badge variant="success" className="text-[10px]">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------ training --------------------------- */}
        <TabsContent value="training" className="space-y-5">
          <CreateTrainingForm skills={skills} locations={locations} onCreated={() => router.refresh()} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training programmes ({training.length})</CardTitle>
              <CardDescription>These power the learning-path engine.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Provider</th>
                    <th className="py-2 pr-4 font-medium">Duration</th>
                    <th className="py-2 pr-4 font-medium">Cost</th>
                    <th className="py-2 pr-4 font-medium">Enrolments</th>
                  </tr>
                </thead>
                <tbody>
                  {training.map((programme) => (
                    <tr key={programme.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{programme.title}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{programme.provider}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{programme.durationWeeks} wk</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {programme.cost === 0 ? (
                          <Badge variant="success" className="text-[10px]">
                            Free
                          </Badge>
                        ) : (
                          formatINR(programme.cost)
                        )}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {programme.enrolments.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------ skills ----------------------------- */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-primary" />
                Skill categories ({skillCategories.length})
              </CardTitle>
              <CardDescription>
                The shared catalogue used by jobs, the gap engine, training and the agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillCategories.map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{category}</h3>
                    <Badge variant="muted">{items.length} skills</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {items.map((skill) => (
                      <Badge key={skill.id} variant="outline" className="text-[10px]">
                        {skill.name} · {skill.learningWeeks}w
                      </Badge>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              creation forms                                */
/* -------------------------------------------------------------------------- */

function CreateJobForm({
  skills,
  locations,
  onCreated,
}: {
  skills: Skill[];
  locations: Location[];
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    company: "",
    companyType: "Private",
    sector: "Retail & Services",
    source: "PRIVATE",
    description: "",
    requirements: "",
    responsibilities: "",
    locationId: locations[0]?.id ?? "",
    workMode: "ONSITE" as WorkMode,
    jobType: "FULL_TIME" as JobType,
    salaryMin: "12000",
    salaryMax: "18000",
    experienceRequired: "FRESHER" as ExperienceLevel,
    educationRequired: "CLASS_10" as EducationLevel,
    openings: "1",
    deadlineInDays: "30",
    contactEmail: "careers@demo.example",
    isRuralFriendly: true,
    localLanguageSupport: true,
    skills: [] as { skillId: string; importance: "REQUIRED" | "PREFERRED" | "OPTIONAL" }[],
  });

  const toggleSkill = (skillId: string) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.some((s) => s.skillId === skillId)
        ? current.skills.filter((s) => s.skillId !== skillId)
        : [...current.skills, { skillId, importance: "REQUIRED" }],
    }));
  };

  async function submit() {
    setPending(true);
    try {
      const response = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          requirements: form.requirements.split("\n").map((line) => line.trim()).filter(Boolean),
          responsibilities: form.responsibilities.split("\n").map((line) => line.trim()).filter(Boolean),
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
          openings: Number(form.openings),
          deadlineInDays: Number(form.deadlineInDays),
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);

      toast.success("Job posting saved", { description: `${form.title} is now in the dataset.` });
      setForm((current) => ({ ...current, title: "", company: "", description: "", requirements: "", responsibilities: "", skills: [] }));
      onCreated();
    } catch (error) {
      toast.error("Could not save the job", {
        description: error instanceof Error ? error.message : "Check the required fields.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4 text-primary" />
            Add a job posting
          </CardTitle>
          <CardDescription>New postings immediately enter the matching pool.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-3.5" />
          {open ? "Hide form" : "Add job"}
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="aj-title">Job title *</Label>
              <Input
                id="aj-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Accounts Assistant"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-company">Employer *</Label>
              <Input
                id="aj-company"
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                placeholder="e.g. Utkal Agro Traders (Demo)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-location">Location *</Label>
              <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
                <SelectTrigger id="aj-location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-sector">Sector</Label>
              <Input
                id="aj-sector"
                value={form.sector}
                onChange={(event) => setForm({ ...form, sector: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aj-description">Description * (min 20 characters)</Label>
            <Textarea
              id="aj-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="aj-requirements">Requirements (one per line) *</Label>
              <Textarea
                id="aj-requirements"
                rows={3}
                value={form.requirements}
                onChange={(event) => setForm({ ...form, requirements: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-responsibilities">Responsibilities (one per line) *</Label>
              <Textarea
                id="aj-responsibilities"
                rows={3}
                value={form.responsibilities}
                onChange={(event) => setForm({ ...form, responsibilities: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="aj-min">Min salary (₹)</Label>
              <Input
                id="aj-min"
                type="number"
                value={form.salaryMin}
                onChange={(event) => setForm({ ...form, salaryMin: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-max">Max salary (₹)</Label>
              <Input
                id="aj-max"
                type="number"
                value={form.salaryMax}
                onChange={(event) => setForm({ ...form, salaryMax: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-openings">Openings</Label>
              <Input
                id="aj-openings"
                type="number"
                value={form.openings}
                onChange={(event) => setForm({ ...form, openings: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="aj-deadline">Closes in (days)</Label>
              <Input
                id="aj-deadline"
                type="number"
                value={form.deadlineInDays}
                onChange={(event) => setForm({ ...form, deadlineInDays: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Required skills * (click to toggle)</Label>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {skills.map((skill) => {
                const selected = form.skills.some((s) => s.skillId === skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    aria-pressed={selected}
                    className={
                      selected
                        ? "rounded-full border border-primary bg-primary/10 px-2.5 py-1 text-xs text-primary"
                        : "rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    }
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isRuralFriendly}
                onCheckedChange={(v) => setForm({ ...form, isRuralFriendly: v })}
              />
              Rural-friendly employer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.localLanguageSupport}
                onCheckedChange={(v) => setForm({ ...form, localLanguageSupport: v })}
              />
              Local-language support
            </label>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={pending || !form.title || !form.company || form.skills.length === 0}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Publish posting
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CreateTrainingForm({
  skills,
  locations,
  onCreated,
}: {
  skills: Skill[];
  locations: Location[];
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    provider: "",
    description: "",
    durationWeeks: "6",
    mode: "HYBRID",
    language: "Odia / Hindi",
    cost: "0",
    certification: "",
    careerPath: "",
    locationId: locations[0]?.id ?? "",
    skillIds: [] as string[],
  });

  async function submit() {
    setPending(true);
    try {
      const response = await fetch("/api/admin/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationWeeks: Number(form.durationWeeks),
          cost: Number(form.cost),
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);

      toast.success("Training programme saved", { description: `${form.title} is now available.` });
      setForm((current) => ({ ...current, title: "", provider: "", description: "", skillIds: [] }));
      onCreated();
    } catch (error) {
      toast.error("Could not save the programme", {
        description: error instanceof Error ? error.message : "Check the required fields.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-secondary" />
            Add a training programme
          </CardTitle>
          <CardDescription>Programmes feed the learning-path engine immediately.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-3.5" />
          {open ? "Hide form" : "Add programme"}
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="at-title">Title *</Label>
              <Input
                id="at-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at-provider">Provider *</Label>
              <Input
                id="at-provider"
                value={form.provider}
                onChange={(event) => setForm({ ...form, provider: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="at-description">Description * (min 20 characters)</Label>
            <Textarea
              id="at-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="at-duration">Duration (weeks)</Label>
              <Input
                id="at-duration"
                type="number"
                value={form.durationWeeks}
                onChange={(event) => setForm({ ...form, durationWeeks: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at-cost">Cost (₹, 0 = free)</Label>
              <Input
                id="at-cost"
                type="number"
                value={form.cost}
                onChange={(event) => setForm({ ...form, cost: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at-language">Language</Label>
              <Input
                id="at-language"
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="at-mode">Mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger id="at-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Covers skills * (click to toggle)</Label>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
              {skills.map((skill) => {
                const selected = form.skillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        skillIds: selected
                          ? current.skillIds.filter((id) => id !== skill.id)
                          : [...current.skillIds, skill.id],
                      }))
                    }
                    aria-pressed={selected}
                    className={
                      selected
                        ? "rounded-full border border-secondary bg-secondary/10 px-2.5 py-1 text-xs text-secondary"
                        : "rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    }
                  >
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={pending || !form.title || !form.provider || form.skillIds.length === 0}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Publish programme
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export { Checkbox };
