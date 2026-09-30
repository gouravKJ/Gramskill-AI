"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Target,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Checkbox, Separator } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/shared/metrics";
import { DemoBadge } from "@/components/shared/brand";
import { SKILL_BY_ID } from "@/lib/data/catalogue";
import { cn } from "@/lib/utils";
import type { ApiResult } from "@/lib/api/http";
import type { Job, JobMatch } from "@/types";

/**
 * AI Job Application Assistant.
 *
 * Seven explicit steps, matching the documented product flow:
 *   1 read the job description → 2 compare profile → 3 prepare information →
 *   4 highlight missing information → 5 user reviews → 6 user confirms →
 *   7 status becomes "Submitted" (simulated).
 *
 * The confirm step is a real gate: the API requires `confirmed: true`, so this
 * dialog (or an equally explicit caller) is the only way an application exists.
 */

const STEPS = [
  { icon: FileText, label: "Reading the job description", detail: "Extracting requirements and responsibilities" },
  { icon: BrainCircuit, label: "Comparing your profile", detail: "Skills, education, experience and location" },
  { icon: Sparkles, label: "Preparing application information", detail: "Drafting a cover note from your profile" },
  { icon: Target, label: "Highlighting missing information", detail: "Flagging gaps the employer may ask about" },
];

export type ApplyPhase = "processing" | "review" | "submitting" | "done";

export function ApplyWithAiDialog({
  job,
  match,
  open,
  onOpenChange,
  alreadyApplied,
}: {
  job: Job;
  match: JobMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alreadyApplied?: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<ApplyPhase>("processing");
  const [stepIndex, setStepIndex] = React.useState(0);
  const [coverNote, setCoverNote] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [applicationId, setApplicationId] = React.useState<string | null>(null);

  /** Required skills the employer wants but the profile does not cover yet. */
  const missingRequired = React.useMemo<string[]>(() => {
    const missing = new Set(match?.missingSkills ?? []);
    return job.skills
      .filter((requirement) => requirement.importance === "REQUIRED")
      .map((requirement) => skillName(requirement.skillId))
      .filter((name) => missing.has(name));
  }, [job.skills, match]);

  // Draft the cover note from the profile the first time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setPhase("processing");
    setStepIndex(0);
    setConfirmed(false);
    setApplicationId(null);
    setCoverNote(defaultCoverNote(job, match));
  }, [open, job, match]);

  React.useEffect(() => {
    if (!open || phase !== "processing") return;
    if (stepIndex >= STEPS.length) {
      const timer = setTimeout(() => setPhase("review"), 350);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setStepIndex((i) => i + 1), 620);
    return () => clearTimeout(timer);
  }, [open, phase, stepIndex]);

  async function submit() {
    if (!confirmed) {
      toast.error("Please confirm you have reviewed the application.");
      return;
    }
    setPhase("submitting");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          status: "APPLIED",
          coverNote,
          nextAction: "Wait for the employer to respond; follow up after one week.",
          confirmed: true,
        }),
      });
      const payload = (await response.json()) as ApiResult<{ application: { id: string } }>;
      if (!payload.ok) throw new Error(payload.error);

      setApplicationId(payload.data.application.id);
      setPhase("done");
      toast.success("Application recorded", {
        description: `${job.title} · status is now Applied (demo submission).`,
      });
      router.refresh();
    } catch (error) {
      setPhase("review");
      toast.error("Could not record the application", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (phase === "submitting" ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Apply with AI — {job.title}
            <DemoBadge />
          </DialogTitle>
          <DialogDescription>
            {job.company} · nothing is submitted until you review and confirm.
          </DialogDescription>
        </DialogHeader>

        {/* ------------------------------ processing ------------------------- */}
        {phase === "processing" && (
          <div className="space-y-4 py-2">
            {STEPS.map((step, index) => {
              const state = index < stepIndex ? "done" : index === stepIndex ? "active" : "pending";
              return (
                <div key={step.label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                      state === "done" && "bg-success/15 text-success",
                      state === "active" && "bg-primary/15 text-primary",
                      state === "pending" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "done" ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : state === "active" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <step.icon className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", state === "pending" && "text-muted-foreground")}>
                      {step.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{step.detail}</span>
                  </span>
                </div>
              );
            })}
            <ProgressBar value={(stepIndex / STEPS.length) * 100} tone="primary" />
          </div>
        )}

        {/* -------------------------------- review --------------------------- */}
        {(phase === "review" || phase === "submitting") && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Target className="size-4 text-primary" />
                Step 4 — Missing information
              </h3>
              {missingRequired.length === 0 && (!match || match.missingSkills.length === 0) ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 className="size-3.5" />
                  Nothing critical is missing — your profile covers every required skill.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs text-warning">
                  {(missingRequired.length
                    ? missingRequired
                    : job.skills.slice(0, 3).map((requirement) => skillName(requirement.skillId))
                  ).map((name) => (
                    <li key={name} className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      {name} — not in your profile yet. Adding it would raise your match score.
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                You can still apply. The assistant has written the cover note so it focuses on what you do have.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <UserCheck className="size-4 text-primary" />
                Step 5 — Review your application
              </h3>
              <p className="text-xs text-muted-foreground">
                This cover note was generated from your profile. Edit it freely before submitting.
              </p>
              <Textarea
                value={coverNote}
                onChange={(event) => setCoverNote(event.target.value)}
                rows={9}
                className="font-mono text-xs leading-relaxed"
                aria-label="Cover note"
              />
              <p className="text-[11px] text-muted-foreground">
                {coverNote.length} characters · the employer will see this text (demo).
              </p>
            </div>

            <Separator />

            <label className="flex items-start gap-3 rounded-xl border border-border p-3">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                className="mt-0.5"
                aria-label="Confirm review"
              />
              <span className="text-xs leading-relaxed">
                <strong className="block text-sm">Step 6 — Confirm &amp; Submit</strong>
                I have reviewed this application and I confirm I want to submit it to {job.company}. I
                understand this is a <strong>demo submission</strong> and no real employer will be contacted.
              </span>
            </label>
          </div>
        )}

        {/* --------------------------------- done ---------------------------- */}
        {phase === "done" && (
          <div className="space-y-4 py-2 text-center">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success"
            >
              <CheckCircle2 className="size-7" />
            </motion.span>
            <div>
              <h3 className="font-display text-lg font-semibold">Application submitted (demo)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.title} at {job.company} now shows <Badge variant="success">Applied</Badge> in your tracker.
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-left text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Simulated action.</strong> This prototype records the
                application in its own database only. Connecting a real employer ATS would happen in{" "}
                <code className="rounded bg-card px-1.5 py-0.5 font-mono">POST /api/applications</code>.
              </p>
              {applicationId && (
                <p className="mt-2">
                  Application reference: <code className="font-mono">{applicationId}</code>
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === "processing" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {(phase === "review" || phase === "submitting") && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={phase === "submitting"}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!confirmed || phase === "submitting"}>
                {phase === "submitting" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Confirm &amp; Submit
              </Button>
            </>
          )}

          {phase === "done" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push("/applications");
                }}
              >
                Go to tracker
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function skillName(id: string) {
  return SKILL_BY_ID.get(id)?.name ?? id;
}

function defaultCoverNote(job: Job, match: JobMatch | null) {
  const skills = match?.matchedSkills.slice(0, 5).join(", ");
  return [
    "Dear Hiring Team,",
    "",
    `I am applying for the ${job.title} position at ${job.company}.`,
    skills ? `My skills include ${skills}, which line up with what this role needs.` : "",
    job.isRuralFriendly
      ? "I come from a rural area and am comfortable working locally with the community."
      : "",
    "I am available to join at the earliest and can attend an interview at your convenience.",
    "",
    "Thank you for your consideration.",
  ]
    .filter(Boolean)
    .join("\n");
}

export { AnimatePresence };
