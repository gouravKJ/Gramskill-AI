"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                              Animated counter                              */
/* -------------------------------------------------------------------------- */

export function Counter({
  value,
  duration = 1.1,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (latest) => `${prefix}${Math.round(latest)}${suffix}`);

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{display}</motion.span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Score ring                                 */
/* -------------------------------------------------------------------------- */

export function ScoreRing({
  score,
  size = 128,
  strokeWidth = 10,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const tone =
    clamped >= 80 ? "hsl(var(--success))" : clamped >= 60 ? "hsl(var(--primary))" : "hsl(var(--warning))";

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-2xl font-bold leading-none tabular-nums">{clamped}%</div>
          {label && <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>}
        </div>
      </div>
      <span className="sr-only">
        {label ?? "Score"}: {clamped} out of 100
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Stat card                                  */
/* -------------------------------------------------------------------------- */

/**
 * Dashboard metric card.
 *
 * `icon` accepts a React element (not a component type) so server components can
 * render this client component without crossing a non-serialisable boundary.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  className,
  animate = true,
  suffix = "",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "primary" | "secondary" | "warning" | "success";
  className?: string;
  animate?: boolean;
  suffix?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/12 text-success",
  };

  return (
    <div
      className={cn(
        "group rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-105 [&_svg]:size-4",
              tones[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums">
        {typeof value === "number" && animate ? <Counter value={value} suffix={suffix} /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Match badge                                 */
/* -------------------------------------------------------------------------- */

export function MatchBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80
      ? "border-success/30 bg-success/10 text-success"
      : score >= 60
        ? "border-primary/30 bg-primary/10 text-primary"
        : score >= 45
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-border bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {score}% match
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Skill chip                                 */
/* -------------------------------------------------------------------------- */

export function SkillChip({
  name,
  state = "unknown",
  className,
  title,
}: {
  name: string;
  state?: "have" | "partial" | "missing" | "unknown";
  className?: string;
  title?: string;
}) {
  const styles: Record<string, string> = {
    have: "border-success/30 bg-success/8 text-success",
    partial: "border-warning/35 bg-warning/10 text-warning",
    missing: "border-destructive/25 bg-destructive/8 text-destructive",
    unknown: "border-border bg-muted/60 text-muted-foreground",
  };
  const Icon = state === "have" ? Check : state === "partial" ? Minus : state === "missing" ? X : null;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[state],
        className,
      )}
    >
      {Icon && <Icon className="size-3" strokeWidth={3} />}
      {name}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Profile progress                              */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  value,
  className,
  tone = "primary",
  height = 8,
}: {
  value: number;
  className?: string;
  tone?: "primary" | "secondary" | "success" | "warning";
  height?: number;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-success",
    warning: "bg-warning",
  };
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-muted", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn("h-full rounded-full", tones[tone])}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}
