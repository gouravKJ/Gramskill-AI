"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApplyWithAiDialog } from "@/components/jobs/apply-dialog";
import { WhyMatchDialog } from "@/components/jobs/why-match";
import type { ApiResult } from "@/lib/api/http";
import type { Job, JobMatch } from "@/types";

export function JobDetailActions({
  job,
  match,
  applied,
  saved,
}: {
  job: Job;
  match: JobMatch | null;
  applied: boolean;
  saved: boolean;
}) {
  const router = useRouter();
  const [whyOpen, setWhyOpen] = React.useState(false);
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(saved);
  const [pending, setPending] = React.useState(false);

  async function toggleSaved() {
    setPending(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          status: "SAVED",
          coverNote: "",
          nextAction: "Complete the missing skills, then apply.",
          confirmed: true,
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);
      setIsSaved(true);
      toast.success("Saved for later", { description: "Find it in your application tracker." });
      router.refresh();
    } catch (error) {
      toast.error("Could not save this job", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {match && (
          <Button variant="outline" onClick={() => setWhyOpen(true)} className="flex-1 sm:flex-none">
            <HelpCircle className="size-4" />
            Why This Match?
          </Button>
        )}
        <Button
          variant="outline"
          onClick={toggleSaved}
          disabled={isSaved || pending}
          className="flex-1 sm:flex-none"
        >
          {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          {isSaved ? "Saved" : "Save for later"}
        </Button>
        <Button
          onClick={() => setApplyOpen(true)}
          disabled={applied}
          className="w-full flex-1 sm:w-auto sm:flex-none"
        >
          <Sparkles className="size-4" />
          {applied ? "Application submitted" : "Apply with AI"}
        </Button>
      </div>

      {match && (
        <WhyMatchDialog
          job={job}
          match={match}
          open={whyOpen}
          onOpenChange={setWhyOpen}
          onStartLearning={() => {
            setWhyOpen(false);
            router.push(`/training?targetJobId=${job.id}`);
          }}
        />
      )}

      <ApplyWithAiDialog
        job={job}
        match={match}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        alreadyApplied={applied}
      />
    </>
  );
}
