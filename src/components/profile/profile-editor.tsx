"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/misc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/shared/metrics";
import { usePreferences } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";
import type { ApiResult } from "@/lib/api/http";
import type {
  EducationLevel,
  ExperienceLevel,
  JobType,
  Location,
  Profile,
  Skill,
  SkillProficiency,
  WorkMode,
} from "@/types";

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "BELOW_10", label: "Below Class 10" },
  { value: "CLASS_10", label: "Class 10 (Matric)" },
  { value: "CLASS_12", label: "Class 12 (Intermediate)" },
  { value: "ITI", label: "ITI trade certificate" },
  { value: "DIPLOMA", label: "Diploma / Polytechnic" },
  { value: "GRADUATE", label: "Graduate" },
  { value: "POST_GRADUATE", label: "Post Graduate" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "FRESHER", label: "Fresher" },
  { value: "ZERO_TO_ONE", label: "0–1 years" },
  { value: "ONE_TO_THREE", label: "1–3 years" },
  { value: "THREE_PLUS", label: "3+ years" },
];

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "APPRENTICESHIP", label: "Apprenticeship" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "GIG", label: "Gig / piece work" },
];

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "ONSITE", label: "On-site" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "FIELD", label: "Field work" },
];

export function ProfileEditor({
  profile,
  skills,
  locations,
  completion,
}: {
  profile: Profile;
  skills: Skill[];
  locations: Location[];
  completion: number;
}) {
  const router = useRouter();
  const { prefs, toggle } = usePreferences();
  const [saving, setSaving] = React.useState(false);
  const [skillQuery, setSkillQuery] = React.useState("");
  const [state, setState] = React.useState(profile);

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;

  const filteredSkills = React.useMemo(() => {
    const needle = skillQuery.trim().toLowerCase();
    const selected = new Set(state.skills.map((s) => s.skillId));
    const list = needle
      ? skills.filter(
          (skill) =>
            skill.name.toLowerCase().includes(needle) || skill.aliases.some((a) => a.includes(needle)),
        )
      : skills.filter((skill) => !selected.has(skill.id));
    return list.slice(0, 24);
  }, [skills, skillQuery, state.skills]);

  function addSkill(skillId: string) {
    const skill = skills.find((s) => s.id === skillId);
    setState((current) => ({
      ...current,
      skills: [
        ...current.skills,
        { skillId, proficiency: "INTERMEDIATE", yearsExperience: skill ? Math.min(skill.learningWeeks, 2) : 1 },
      ],
    }));
  }

  function removeSkill(skillId: string) {
    setState((current) => ({
      ...current,
      skills: current.skills.filter((s) => s.skillId !== skillId),
    }));
  }

  function setProficiency(skillId: string, proficiency: SkillProficiency) {
    setState((current) => ({
      ...current,
      skills: current.skills.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s)),
    }));
  }

  const toggleArray = <K extends "jobTypes" | "workModes" | "preferredLocationIds" | "industries">(
    key: K,
    value: string,
  ) => {
    setState((current) => {
      const list = current[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...current, [key]: next } as Profile;
    });
  };

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          age: state.age,
          phone: state.phone,
          locationId: state.locationId,
          language: state.language,
          education: state.education,
          course: state.course,
          graduationYear: state.graduationYear,
          experience: state.experience,
          jobTypes: state.jobTypes,
          preferredLocationIds: state.preferredLocationIds,
          salaryExpectation: state.salaryExpectation,
          workModes: state.workModes,
          industries: state.industries,
          careerGoal: state.careerGoal,
          bio: state.bio,
          skills: state.skills,
          onboardingCompleted: true,
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);

      toast.success("Profile saved", {
        description: "Your match scores have been recalculated with the new information.",
      });
      router.refresh();
    } catch (error) {
      toast.error("Could not save your profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 pt-5">
          <div className="min-w-48 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Profile completeness</p>
            <p className="mt-1 font-display text-2xl font-bold">{completion}%</p>
            <ProgressBar value={completion} className="mt-2" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
            <Button variant="outline" onClick={() => setState(profile)} disabled={saving}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="skills">Skills ({state.skills.length})</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        {/* ------------------------------ personal --------------------------- */}
        <TabsContent value="personal">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic information</CardTitle>
                <CardDescription>Used for matching, distance calculation and the assistant's language.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-name">Full name</Label>
                    <Input
                      id="pf-name"
                      value={state.name}
                      onChange={(event) => update("name", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-age">Age</Label>
                    <Input
                      id="pf-age"
                      type="number"
                      value={state.age ?? ""}
                      onChange={(event) => update("age", event.target.value ? Number(event.target.value) : null)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pf-phone">Phone number</Label>
                  <Input
                    id="pf-phone"
                    value={state.phone ?? ""}
                    onChange={(event) => update("phone", event.target.value || null)}
                    placeholder="Optional — used on application drafts"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pf-location">Location</Label>
                  <Select value={state.locationId} onValueChange={(value) => update("locationId", value)}>
                    <SelectTrigger id="pf-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} · {location.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Preferred language</Label>
                  <div className="flex gap-2">
                    {(["en", "hi"] as const).map((locale) => (
                      <Button
                        key={locale}
                        type="button"
                        variant={state.language === locale ? "default" : "outline"}
                        size="sm"
                        onClick={() => update("language", locale)}
                      >
                        {locale === "en" ? "English" : "हिन्दी"}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Career goal &amp; summary</CardTitle>
                <CardDescription>
                  Plain language is fine. The assistant and the semantic matcher both read this.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pf-goal">Career goal</Label>
                  <Textarea
                    id="pf-goal"
                    value={state.careerGoal}
                    onChange={(event) => update("careerGoal", event.target.value)}
                    rows={3}
                    placeholder="I want a job near my village."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-bio">About me</Label>
                  <Textarea
                    id="pf-bio"
                    value={state.bio}
                    onChange={(event) => update("bio", event.target.value)}
                    rows={4}
                    placeholder="Anything you want employers or the AI to know."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-resume">Resume / experience summary</Label>
                  <Textarea
                    id="pf-resume"
                    value={state.resumeText}
                    onChange={(event) => update("resumeText", event.target.value)}
                    rows={5}
                    placeholder="Paste or type your work history. The NLP matcher uses this text for semantic similarity."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------- skills ---------------------------- */}
        <TabsContent value="skills">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your skills ({state.skills.length})</CardTitle>
                <CardDescription>Proficiency level changes the skill-match factor in your score.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {state.skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No skills yet — add some from the list on the right.
                  </p>
                )}
                {state.skills.map((entry) => (
                  <div key={entry.skillId} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{skillName(entry.skillId)}</span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => removeSkill(entry.skillId)}
                        aria-label={`Remove ${skillName(entry.skillId)}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setProficiency(entry.skillId, level)}
                          aria-pressed={entry.proficiency === level}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            entry.proficiency === level
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add skills</CardTitle>
                <CardDescription>
                  {skills.length} skills available in the shared catalogue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={skillQuery}
                    onChange={(event) => setSkillQuery(event.target.value)}
                    placeholder="Search skills…"
                    className="pl-9"
                    aria-label="Search skills"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => addSkill(skill.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus className="size-3" />
                      {skill.name}
                    </button>
                  ))}
                  {filteredSkills.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {skillQuery ? "No match — try a shorter word." : "All catalogue skills are already added."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ----------------------------- education --------------------------- */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Education &amp; experience</CardTitle>
              <CardDescription>
                Education and experience are scored against each job's stated requirement.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pf-education">Highest qualification</Label>
                <Select
                  value={state.education ?? ""}
                  onValueChange={(value) => update("education", value as EducationLevel)}
                >
                  <SelectTrigger id="pf-education">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pf-experience">Experience</Label>
                <Select
                  value={state.experience ?? ""}
                  onValueChange={(value) => update("experience", value as ExperienceLevel)}
                >
                  <SelectTrigger id="pf-experience">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pf-course">Course / stream</Label>
                <Input
                  id="pf-course"
                  value={state.course ?? ""}
                  onChange={(event) => update("course", event.target.value || null)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pf-year">Graduation year</Label>
                <Input
                  id="pf-year"
                  type="number"
                  value={state.graduationYear ?? ""}
                  onChange={(event) =>
                    update("graduationYear", event.target.value ? Number(event.target.value) : null)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------- preferences -------------------------- */}
        <TabsContent value="preferences">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Work preferences</CardTitle>
                <CardDescription>These carry 10% of your match score.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Job types</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {JOB_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => toggleArray("jobTypes", type.value)}
                        aria-pressed={state.jobTypes.includes(type.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          state.jobTypes.includes(type.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Work modes</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {WORK_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => toggleArray("workModes", mode.value)}
                        aria-pressed={state.workModes.includes(mode.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          state.workModes.includes(mode.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pf-salary">Expected monthly salary (₹)</Label>
                  <Input
                    id="pf-salary"
                    type="number"
                    min={0}
                    step={1000}
                    value={state.salaryExpectation ?? ""}
                    onChange={(event) =>
                      update("salaryExpectation", event.target.value ? Number(event.target.value) : null)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferred locations</CardTitle>
                <CardDescription>Chosen locations score full marks on the location factor.</CardDescription>
              </CardHeader>
              <CardContent className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
                {locations.map((location) => (
                  <label key={location.id} className="flex items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={state.preferredLocationIds.includes(location.id)}
                      onCheckedChange={() => toggleArray("preferredLocationIds", location.id)}
                    />
                    <span className="truncate">{location.name}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --------------------------- accessibility -------------------------- */}
        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accessibility &amp; device settings</CardTitle>
              <CardDescription>
                Saved on this device only. Useful on shared family phones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: "simpleLanguage" as const, label: "Simple language", description: "Short, easy words everywhere." },
                { key: "lowBandwidth" as const, label: "Low-bandwidth mode", description: "Removes heavy visual effects." },
                { key: "reduceMotion" as const, label: "Reduce animations", description: "Turns off transitions." },
                { key: "largeText" as const, label: "Larger text", description: "Increases base font size." },
              ].map((row) => (
                <label
                  key={row.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border p-3"
                >
                  <span>
                    <span className="block text-sm font-medium">{row.label}</span>
                    <span className="block text-xs text-muted-foreground">{row.description}</span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant={prefs[row.key] ? "default" : "outline"}
                    onClick={() => toggle(row.key)}
                    aria-pressed={prefs[row.key]}
                    className="shrink-0"
                  >
                    {prefs[row.key] ? <Check className="size-3.5" /> : null}
                    {prefs[row.key] ? "On" : "Off"}
                  </Button>
                </label>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Voice input appears automatically in supported browsers when you use the AI assistant.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="muted">
          {state.skills.length} skills · {state.jobTypes.length} job types ·{" "}
          {state.preferredLocationIds.length} preferred locations
        </Badge>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
