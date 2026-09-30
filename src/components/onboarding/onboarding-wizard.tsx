"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Target,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox, Separator } from "@/components/ui/misc";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiThinking } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { ScoreRing } from "@/components/shared/metrics";
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

const STEPS = [
  { icon: User, title: "Personal Information", description: "So we can match jobs you can realistically reach." },
  { icon: GraduationCap, title: "Education", description: "Many rural roles require a specific qualification level." },
  { icon: Wrench, title: "Skills", description: "Pick everything you can do — even informal or family-taught skills." },
  { icon: Briefcase, title: "Experience", description: "Fresher is completely fine; most demo jobs accept it." },
  { icon: Target, title: "Preferences", description: "What kind of work and pay you are looking for." },
  { icon: Sparkles, title: "Career Goal", description: "Tell the assistant what you want in your own words." },
];

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: "BELOW_10", label: "Below Class 10" },
  { value: "CLASS_10", label: "Class 10 (Matric)" },
  { value: "CLASS_12", label: "Class 12 (Intermediate)" },
  { value: "ITI", label: "ITI trade certificate" },
  { value: "DIPLOMA", label: "Diploma / Polytechnic" },
  { value: "GRADUATE", label: "Graduate" },
  { value: "POST_GRADUATE", label: "Post Graduate" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; detail: string }[] = [
  { value: "FRESHER", label: "Fresher", detail: "No work experience yet" },
  { value: "ZERO_TO_ONE", label: "0–1 years", detail: "Some informal or short-term work" },
  { value: "ONE_TO_THREE", label: "1–3 years", detail: "Working experience" },
  { value: "THREE_PLUS", label: "3+ years", detail: "Experienced" },
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
  { value: "REMOTE", label: "Remote / from home" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "FIELD", label: "Field work (travelling)" },
];

const INDUSTRIES = [
  "Agriculture",
  "Accounting & Finance",
  "Government Administration",
  "IT & Software",
  "Retail & Services",
  "Manufacturing",
  "Healthcare",
  "Textiles",
  "Construction & Infrastructure",
  "Logistics",
  "Hospitality",
  "Renewable Energy",
];

const GOAL_SUGGESTIONS = [
  "I want a job near my village.",
  "I want to become an Accounts Assistant.",
  "I want work-from-home data entry work.",
  "I want an apprenticeship in solar installation.",
  "I want to start my own small business.",
];

interface WizardState {
  name: string;
  age: string;
  locationId: string;
  language: "en" | "hi";
  education: EducationLevel | "";
  course: string;
  graduationYear: string;
  skills: { skillId: string; proficiency: SkillProficiency; yearsExperience: number }[];
  experience: ExperienceLevel | "";
  jobTypes: JobType[];
  preferredLocationIds: string[];
  salaryExpectation: string;
  workModes: WorkMode[];
  industries: string[];
  careerGoal: string;
}

export function OnboardingWizard({
  profile,
  skills,
  locations,
}: {
  profile: Profile;
  skills: Skill[];
  locations: Location[];
}) {
  const router = useRouter();
  const { setPref } = usePreferences();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [analysing, setAnalysing] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [skillQuery, setSkillQuery] = React.useState("");

  const [state, setState] = React.useState<WizardState>({
    name: profile.name ?? "",
    age: profile.age ? String(profile.age) : "",
    locationId: profile.locationId || locations[0]?.id || "",
    language: profile.language ?? "en",
    education: profile.education ?? "",
    course: profile.course ?? "",
    graduationYear: profile.graduationYear ? String(profile.graduationYear) : "",
    skills: profile.skills ?? [],
    experience: profile.experience ?? "",
    jobTypes: profile.jobTypes ?? [],
    preferredLocationIds: profile.preferredLocationIds ?? [],
    salaryExpectation: profile.salaryExpectation ? String(profile.salaryExpectation) : "",
    workModes: profile.workModes ?? [],
    industries: profile.industries ?? [],
    careerGoal: profile.careerGoal ?? "",
  });

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const filteredSkills = React.useMemo(() => {
    const needle = skillQuery.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter(
      (skill) => skill.name.toLowerCase().includes(needle) || skill.aliases.some((a) => a.includes(needle)),
    );
  }, [skills, skillQuery]);

  const toggleSkill = (skillId: string) => {
    setState((current) => {
      const exists = current.skills.some((s) => s.skillId === skillId);
      return {
        ...current,
        skills: exists
          ? current.skills.filter((s) => s.skillId !== skillId)
          : [...current.skills, { skillId, proficiency: "INTERMEDIATE", yearsExperience: 1 }],
      };
    });
  };

  const setProficiency = (skillId: string, proficiency: SkillProficiency) =>
    setState((current) => ({
      ...current,
      skills: current.skills.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s)),
    }));

  const toggleArray = <K extends "jobTypes" | "workModes" | "industries" | "preferredLocationIds">(
    key: K,
    value: string,
  ) => {
    setState((current) => {
      const list = current[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...current, [key]: next } as WizardState;
    });
  };

  const stepValid = React.useMemo(() => {
    switch (step) {
      case 0:
        return state.name.trim().length >= 2 && Boolean(state.locationId);
      case 1:
        return Boolean(state.education);
      case 2:
        return state.skills.length >= 1;
      case 3:
        return Boolean(state.experience);
      case 4:
        return state.jobTypes.length > 0 && state.workModes.length > 0;
      default:
        return state.careerGoal.trim().length >= 8;
    }
  }, [step, state]);

  async function finish() {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          age: state.age ? Number(state.age) : null,
          locationId: state.locationId,
          language: state.language,
          education: state.education || null,
          course: state.course.trim() || null,
          graduationYear: state.graduationYear ? Number(state.graduationYear) : null,
          experience: state.experience || null,
          jobTypes: state.jobTypes,
          preferredLocationIds: state.preferredLocationIds,
          salaryExpectation: state.salaryExpectation ? Number(state.salaryExpectation) : null,
          workModes: state.workModes,
          industries: state.industries,
          careerGoal: state.careerGoal.trim(),
          skills: state.skills,
          onboardingCompleted: true,
        }),
      });

      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);

      setPref("language", state.language);
      setAnalysing(true);
      // Let the user see the AI analysis animation before redirecting.
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setAnalysing(false);
      setDone(true);
      router.refresh();
    } catch (error) {
      toast.error("Could not save your profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (analysing) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-4 pt-6">
          <AiThinking
            label="Building your AI career profile"
            steps={[
              "Normalising your skill profile",
              "Scoring every job against your profile",
              "Detecting skill gaps for your career goal",
              "Ranking training programmes",
            ]}
          />
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-5 py-8 text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success"
          >
            <CheckCircle2 className="size-8" />
          </motion.span>
          <div>
            <h2 className="font-display text-2xl font-bold">Your AI Career Profile is Ready.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We ranked {state.skills.length} skills against the demo job pool, detected your skill gaps and
              built a training path. Your dashboard is ready.
            </p>
          </div>
          <div className="flex justify-center">
            <ScoreRing
              score={Math.min(100, 40 + state.skills.length * 8)}
              label="Profile strength"
              size={128}
            />
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => router.push("/dashboard")} size="lg">
              Go to my dashboard <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push("/agent")}>
              <Sparkles className="size-4" /> Meet the AI assistant
            </Button>
          </div>
          <DemoBadge long />
        </CardContent>
      </Card>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length} · {STEPS[step].title}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2" />
        <div className="mt-3 hidden justify-between gap-1 sm:flex">
          {STEPS.map((s, index) => (
            <button
              key={s.title}
              type="button"
              onClick={() => index <= step && setStep(index)}
              disabled={index > step}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium transition-colors",
                index === step
                  ? "bg-primary/10 text-primary"
                  : index < step
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground",
              )}
            >
              {index < step ? <Check className="size-3" /> : <s.icon className="size-3" />}
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StepIcon className="size-4 text-primary" />
            {STEPS[step].title}
          </CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="space-y-5"
            >
              {/* ----------------------------- step 1 ---------------------- */}
              {step === 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="wz-name">Full name *</Label>
                      <Input
                        id="wz-name"
                        value={state.name}
                        onChange={(event) => update("name", event.target.value)}
                        placeholder="e.g. Ravi Kumar"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wz-age">Age</Label>
                      <Input
                        id="wz-age"
                        type="number"
                        inputMode="numeric"
                        min={14}
                        max={70}
                        value={state.age}
                        onChange={(event) => update("age", event.target.value)}
                        placeholder="e.g. 22"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="wz-location">Your location *</Label>
                    <Select value={state.locationId} onValueChange={(value) => update("locationId", value)}>
                      <SelectTrigger id="wz-location">
                        <SelectValue placeholder="Choose your district or town" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                            {location.district !== "—" && ` · ${location.district}, ${location.state}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="size-3" />
                      We use this to calculate travel distance for every job. Demo coordinates only.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Preferred language</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["en", "hi"] as const).map((locale) => (
                        <button
                          key={locale}
                          type="button"
                          onClick={() => update("language", locale)}
                          aria-pressed={state.language === locale}
                          className={cn(
                            "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                            state.language === locale
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          {locale === "en" ? "English" : "हिन्दी"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ----------------------------- step 2 ---------------------- */}
              {step === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="wz-education">Highest qualification *</Label>
                    <Select
                      value={state.education}
                      onValueChange={(value) => update("education", value as EducationLevel)}
                    >
                      <SelectTrigger id="wz-education">
                        <SelectValue placeholder="Select your highest qualification" />
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="wz-course">Course / stream</Label>
                      <Input
                        id="wz-course"
                        value={state.course}
                        onChange={(event) => update("course", event.target.value)}
                        placeholder="e.g. Diploma in Commerce"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wz-year">Graduation year</Label>
                      <Input
                        id="wz-year"
                        type="number"
                        inputMode="numeric"
                        min={1970}
                        max={new Date().getFullYear() + 6}
                        value={state.graduationYear}
                        onChange={(event) => update("graduationYear", event.target.value)}
                        placeholder="e.g. 2024"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ----------------------------- step 3 ---------------------- */}
              {step === 2 && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Select your skills *</Label>
                    <Badge variant="default">{state.skills.length} selected</Badge>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={skillQuery}
                      onChange={(event) => setSkillQuery(event.target.value)}
                      placeholder="Search skills, e.g. Excel, Tally, Driving…"
                      className="pl-9"
                      aria-label="Search skills"
                    />
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                    {filteredSkills.map((skill) => {
                      const selected = state.skills.find((s) => s.skillId === skill.id);
                      return (
                        <div
                          key={skill.id}
                          className={cn(
                            "rounded-lg border p-2.5 transition-colors",
                            selected ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted/60",
                          )}
                        >
                          <label className="flex cursor-pointer items-center gap-2.5">
                            <Checkbox
                              checked={Boolean(selected)}
                              onCheckedChange={() => toggleSkill(skill.id)}
                            />
                            <span className="flex-1">
                              <span className="block text-sm font-medium">{skill.name}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {skill.category} · about {skill.learningWeeks} weeks to learn from scratch
                              </span>
                            </span>
                          </label>
                          {selected && (
                            <div className="mt-2 flex gap-1.5 pl-7">
                              {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => setProficiency(skill.id, level)}
                                  aria-pressed={selected.proficiency === level}
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                    selected.proficiency === level
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {level.charAt(0) + level.slice(1).toLowerCase()}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredSkills.length === 0 && (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No skill matches “{skillQuery}”. Try a shorter word.
                      </p>
                    )}
                  </div>

                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                    Include everyday skills too — farming, driving, tailoring and cooking all count and are
                    genuinely in demand in the demo dataset.
                  </p>
                </>
              )}

              {/* ----------------------------- step 4 ---------------------- */}
              {step === 3 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {EXPERIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update("experience", option.value)}
                      aria-pressed={state.experience === option.value}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        state.experience === option.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{option.detail}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ----------------------------- step 5 ---------------------- */}
              {step === 4 && (
                <>
                  <div className="space-y-2">
                    <Label>Job type *</Label>
                    <div className="flex flex-wrap gap-2">
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

                  <Separator />

                  <div className="space-y-2">
                    <Label>Work mode *</Label>
                    <div className="flex flex-wrap gap-2">
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

                  <Separator />

                  <div className="space-y-1.5">
                    <Label htmlFor="wz-salary">Expected monthly salary (₹)</Label>
                    <Input
                      id="wz-salary"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1000}
                      value={state.salaryExpectation}
                      onChange={(event) => update("salaryExpectation", event.target.value)}
                      placeholder="e.g. 15000"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Leave blank if you are not sure — we will still rank by fit.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred work locations (optional)</Label>
                    <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                      {locations.map((location) => (
                        <label key={location.id} className="flex items-center gap-2.5 text-sm">
                          <Checkbox
                            checked={state.preferredLocationIds.includes(location.id)}
                            onCheckedChange={() => toggleArray("preferredLocationIds", location.id)}
                          />
                          <span className="truncate">{location.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred industries (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRIES.map((industry) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => toggleArray("industries", industry)}
                          aria-pressed={state.industries.includes(industry)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            state.industries.includes(industry)
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {industry}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ----------------------------- step 6 ---------------------- */}
              {step === 5 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="wz-goal">What do you want to achieve? *</Label>
                    <Textarea
                      id="wz-goal"
                      value={state.careerGoal}
                      onChange={(event) => update("careerGoal", event.target.value)}
                      placeholder="Example: I want a job near my village."
                      rows={4}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Write it in your own words, in English or Hindi. The assistant uses this to explain
                      matches and pick training.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Need an idea?</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => update("careerGoal", suggestion)}
                          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs leading-relaxed">
                    <p className="font-semibold text-primary">What happens next</p>
                    <p className="mt-1 text-muted-foreground">
                      We score every demo job against your profile, detect the skills you are missing for your
                      goal, rank training programmes and prepare your dashboard. Nothing is submitted
                      anywhere until you choose to apply.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {stepValid ? "Looks good" : "Complete this step to continue"}
          </span>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!stepValid || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Analyse my profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
