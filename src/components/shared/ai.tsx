"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Check, Loader2, Sparkles, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/app-providers";
import type { AgentToolCall } from "@/types";

/** Animated "AI is thinking" indicator used while tools run. */
export function AiThinking({
  label,
  steps = ["Reading your profile", "Matching against jobs", "Preparing the answer"],
  className,
}: {
  label?: string;
  steps?: string[];
  className?: string;
}) {
  const t = useT();
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % steps.length), 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <span className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <BrainCircuit className="size-4" />
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-[var(--animate-pulse-ring)]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="size-3.5 text-secondary" />
          {label ?? t("label.aiThinking")}
          <span className="inline-flex gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="mb-0.5 inline-block size-1 rounded-full bg-current"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </span>
        </p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          {steps.map((step, i) => (
            <li
              key={step}
              className={cn("flex items-center gap-1.5 transition-colors", i === active && "text-foreground")}
            >
              <span className={cn("size-1 rounded-full", i <= active ? "bg-primary" : "bg-muted")} />
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Three-dot typing indicator for chat bubbles. */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </span>
  );
}

const STATUS_ICON = {
  PENDING: Loader2,
  RUNNING: Loader2,
  DONE: Check,
  ERROR: X,
  AWAITING_APPROVAL: Sparkles,
};

/**
 * Renders the agent's reasoning trace: which tools ran, with what input and
 * what they returned. This is the transparency layer that makes the "agentic"
 * behaviour visible to a reviewer or evaluator.
 */
export function ToolTrace({
  calls,
  className,
  defaultOpen = true,
}: {
  calls: AgentToolCall[];
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (!calls.length) return null;

  return (
    <div className={cn("rounded-xl border border-border bg-muted/40", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <Wrench className="size-3.5" />
        Agent ran {calls.length} tool{calls.length > 1 ? "s" : ""}
        <span className="ml-auto text-[10px]">{open ? "Hide" : "Show"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            {calls.map((call) => {
              const Icon = STATUS_ICON[call.status] ?? Check;
              return (
                <li key={call.id} className="flex items-start gap-2.5 px-3 py-2 text-xs">
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                      call.status === "AWAITING_APPROVAL"
                        ? "bg-warning/15 text-warning"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className={cn("size-3", call.status !== "DONE" && "animate-spin")} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-secondary">
                        {call.name}()
                      </code>
                      <span className="font-medium text-foreground">{call.label}</span>
                      <span className="text-[10px] text-muted-foreground">{call.durationMs}ms</span>
                    </span>
                    <span className="mt-0.5 block text-muted-foreground">{call.resultSummary}</span>
                  </span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small inline "AI generated" tag for sections produced by the engines. */
export function AiTag({ children = "AI generated" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
      <Sparkles className="size-3" />
      {children}
    </span>
  );
}
