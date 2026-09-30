"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ApiResult } from "@/lib/api/http";
import type { TrainingStatus } from "@/types";

export function EnrollButton({
  trainingId,
  status,
  className,
  size = "sm",
}: {
  trainingId: string;
  status: TrainingStatus | null;
  className?: string;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [current, setCurrent] = React.useState<TrainingStatus | null>(status);

  const nextStatus: TrainingStatus =
    current === "COMPLETED" ? "COMPLETED" : current === "IN_PROGRESS" ? "COMPLETED" : current === "ENROLLED" ? "IN_PROGRESS" : "ENROLLED";

  const label =
    current === "COMPLETED"
      ? "Completed"
      : current === "IN_PROGRESS"
        ? "Mark as completed"
        : current === "ENROLLED"
          ? "Continue learning"
          : "Enrol now";

  async function enrol() {
    setPending(true);
    try {
      const response = await fetch("/api/training/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId,
          status: nextStatus,
          progress: nextStatus === "COMPLETED" ? 100 : nextStatus === "IN_PROGRESS" ? 35 : 0,
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);

      setCurrent(nextStatus);
      toast.success(
        nextStatus === "COMPLETED" ? "Well done — course marked complete" : "Enrolment updated",
        { description: "Your learning path progress has been saved." },
      );
      router.refresh();
    } catch (error) {
      toast.error("Could not update enrolment", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size={size}
      variant={current === "COMPLETED" ? "outline" : current ? "secondary" : "default"}
      onClick={enrol}
      disabled={pending || current === "COMPLETED"}
      className={className}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : current === "COMPLETED" ? (
        <Check className="size-3.5" />
      ) : (
        <Play className="size-3.5" />
      )}
      {label}
    </Button>
  );
}
