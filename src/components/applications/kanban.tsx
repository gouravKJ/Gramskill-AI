"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Clock,
  MapPin,
  MoveRight,
  Plus,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { DemoBadge } from "@/components/shared/brand";
import { MatchBadge } from "@/components/shared/metrics";
import { locationById } from "@/lib/data/catalogue";
import { cn, formatDate, formatSalaryRange, relativeDays } from "@/lib/utils";
import type { ApiResult } from "@/lib/api/http";
import type { Application, ApplicationStatus, Job, JobMatch } from "@/types";

const COLUMNS: { status: ApplicationStatus; label: string; tone: string }[] = [
  { status: "SAVED", label: "Saved", tone: "border-muted-foreground/30" },
  { status: "APPLIED", label: "Applied", tone: "border-secondary/40" },
  { status: "UNDER_REVIEW", label: "Under Review", tone: "border-warning/40" },
  { status: "INTERVIEW", label: "Interview", tone: "border-primary/50" },
  { status: "SELECTED", label: "Selected", tone: "border-success/50" },
  { status: "REJECTED", label: "Rejected", tone: "border-destructive/40" },
];

const ORDER: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "SELECTED",
];

export function ApplicationKanban({
  applications,
  matches,
}: {
  applications: (Application & { job: Job | null })[];
  matches: Record<string, JobMatch>;
}) {
  const router = useRouter();
  const [view, setView] = React.useState<"board" | "list">("board");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const byStatus = React.useMemo(() => {
    const map = new Map<ApplicationStatus, (Application & { job: Job | null })[]>();
    for (const application of applications) {
      map.set(application.status, [...(map.get(application.status) ?? []), application]);
    }
    return map;
  }, [applications]);

  async function advance(application: Application & { job: Job | null }) {
    const index = ORDER.indexOf(application.status);
    if (index === -1 || index === ORDER.length - 1) {
      toast.info("This application is already at the final positive stage.");
      return;
    }
    const next = ORDER[index + 1];
    setPendingId(application.id);
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          note: `Moved to ${next.toLowerCase().replace("_", " ")} from the tracker`,
        }),
      });
      const payload = (await response.json()) as ApiResult<unknown>;
      if (!payload.ok) throw new Error(payload.error);
      toast.success(`Moved to ${next.toLowerCase().replace("_", " ")}`);
      router.refresh();
    } catch (error) {
      toast.error("Could not update the application", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  async function markRejected(application: Application & { job: Job | null }) {
    setPendingId(application.id);
    try {
      await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", note: "Marked as rejected by the user" }),
      });
      toast.info("Marked as rejected — keep going, the next match is waiting.");
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "board" ? "default" : "outline"}
            onClick={() => setView("board")}
          >
            Board
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DemoBadge />
          <Button asChild size="sm" variant="outline">
            <Link href="/jobs">
              <Plus className="size-3.5" /> Find more jobs
            </Link>
          </Button>
        </div>
      </div>

      {applications.length === 0 && (
        <EmptyState
          title="No applications yet"
          description="Save a job or apply using the AI assistant, and it will appear here with reminders."
          action={
            <Button asChild size="sm">
              <Link href="/jobs">Browse matches</Link>
            </Button>
          }
        />
      )}

      {view === "board" && applications.length > 0 && (
        <div className="-mx-3 overflow-x-auto px-3 pb-2">
          <div className="flex min-w-max gap-4">
            {COLUMNS.map((column) => {
              const items = byStatus.get(column.status) ?? [];
              return (
                <section
                  key={column.status}
                  aria-label={column.label}
                  className={cn(
                    "w-72 shrink-0 rounded-xl border-t-2 bg-muted/30 p-3",
                    column.tone,
                  )}
                >
                  <header className="flex items-center justify-between gap-2 px-1 pb-3">
                    <h2 className="text-sm font-semibold">{column.label}</h2>
                    <Badge variant="muted" className="h-5 px-1.5 text-[10px]">
                      {items.length}
                    </Badge>
                  </header>

                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map((application) => (
                        <motion.div
                          key={application.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ApplicationCard
                            application={application}
                            match={application.job ? matches[application.job.id] : undefined}
                            pending={pendingId === application.id}
                            onAdvance={() => advance(application)}
                            onReject={() => markRejected(application)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {items.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                        Nothing here
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="flex flex-wrap items-center gap-4 pt-5">
                <div className="min-w-48 flex-1">
                  <p className="text-sm font-semibold">{application.job?.title ?? "Unknown role"}</p>
                  <p className="text-xs text-muted-foreground">
                    {application.job?.company} ·{" "}
                    {application.job ? locationById(application.job.locationId).name : "—"}
                  </p>
                </div>
                <Badge variant={statusVariant(application.status)}>
                  {application.status.toLowerCase().replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Applied {formatDate(application.appliedAt)}
                </span>
                {application.interviewAt && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Clock className="size-3" />
                    Interview {formatDate(application.interviewAt)}
                  </span>
                )}
                <span className="w-full text-xs text-muted-foreground sm:w-auto">
                  Next: {application.nextAction}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function statusVariant(status: ApplicationStatus) {
  if (status === "SELECTED") return "success" as const;
  if (status === "REJECTED") return "destructive" as const;
  if (status === "INTERVIEW") return "default" as const;
  if (status === "UNDER_REVIEW") return "warning" as const;
  if (status === "APPLIED") return "secondary" as const;
  return "muted" as const;
}

function ApplicationCard({
  application,
  match,
  pending,
  onAdvance,
  onReject,
}: {
  application: Application & { job: Job | null };
  match?: JobMatch;
  pending: boolean;
  onAdvance: () => void;
  onReject: () => void;
}) {
  const job = application.job;
  const deadlineSoon = job && new Date(job.deadline).getTime() - Date.now() < 3 * 86_400_000;

  return (
    <Card className="transition-shadow hover:shadow-[var(--shadow-lift)]">
      <CardContent className="space-y-2.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{job?.title ?? "Unknown role"}</p>
          {match && <MatchBadge score={match.score} className="shrink-0 text-[10px]" />}
        </div>

        <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <Building2 className="size-3 shrink-0" />
          {job?.company ?? "—"}
        </p>
        <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          {job ? locationById(job.locationId).name : "—"}
          {job && <span className="truncate">· {formatSalaryRange(job.salaryMin, job.salaryMax)}</span>}
        </p>

        <dl className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <dt className="text-muted-foreground">Applied</dt>
            <dd className="font-medium">{formatDate(application.appliedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Interview</dt>
            <dd className={cn("font-medium", application.interviewAt && "text-primary")}>
              {application.interviewAt ? formatDate(application.interviewAt) : "—"}
            </dd>
          </div>
        </dl>

        <p className="rounded-lg bg-muted/60 px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground">
          <Target className="mr-1 inline size-3" />
          {application.nextAction}
          {application.nextActionAt && (
            <span className="mt-0.5 block text-muted-foreground/80">
              By {formatDate(application.nextActionAt)}
            </span>
          )}
        </p>

        {deadlineSoon && (
          <p className="flex items-center gap-1 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[10px] text-warning">
            <CalendarClock className="size-3" />
            Employer deadline {relativeDays(job!.deadline)}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {job && (
            <Button asChild size="sm" variant="outline" className="h-7 flex-1 px-2 text-[11px]">
              <Link href={`/jobs/${job.id}`}>
                View <ChevronRight className="size-3" />
              </Link>
            </Button>
          )}
          {application.status !== "REJECTED" && application.status !== "SELECTED" && (
            <Button
              size="sm"
              className="h-7 flex-1 px-2 text-[11px]"
              onClick={onAdvance}
              disabled={pending}
            >
              <MoveRight className="size-3" />
              Advance
            </Button>
          )}
          {application.status !== "REJECTED" && application.status !== "SELECTED" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground"
              onClick={onReject}
              disabled={pending}
            >
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
