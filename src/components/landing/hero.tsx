"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Sprout,
  Target,
  TrendingUp,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoBadge } from "@/components/shared/brand";
import { useT } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

const PIPELINE = [
  { icon: UserCircle2, label: "User Profile", detail: "Skills · Education · Location" },
  { icon: BrainCircuit, label: "AI Skill Analysis", detail: "Feature extraction + ranking" },
  { icon: Target, label: "Skill Gap Detection", detail: "Missing vs required skills" },
  { icon: Briefcase, label: "Job Matching", detail: "Weighted, explainable score" },
  { icon: Bot, label: "Agentic AI", detail: "Search · Explain · Assist" },
  { icon: Sprout, label: "Employment", detail: "Apply · Track · Grow" },
];

const FLOATERS = [
  { icon: Sparkles, label: "AI Job Matches", value: "12 new", tone: "primary", position: "left-0 top-8" },
  { icon: Target, label: "Skill Gap Identified", value: "Tally + GST", tone: "warning", position: "right-0 top-24" },
  { icon: GraduationCap, label: "Training Recommended", value: "3 courses", tone: "secondary", position: "left-4 bottom-24" },
  { icon: CheckCircle2, label: "Applications Tracked", value: "5 active", tone: "success", position: "right-6 bottom-10" },
];

export function Hero() {
  const t = useT();

  return (
    <section className="relative overflow-hidden">
      <div className="decorative-gradient pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />

      <div className="container-page relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* ------------------------------- copy ------------------------------ */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center gap-2"
          >
            <Badge variant="default" className="gap-1.5">
              <Sparkles className="size-3" />
              AI-Based Rural Skill Matching &amp; Employment System
            </Badge>
            <DemoBadge />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-balance mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]"
          >
            Turn Your Skills Into Your{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Next Opportunity.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            AI-powered job matching, skill-gap analysis and intelligent career assistance designed for
            rural communities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/login?demo=1">
                {t("action.findOpportunities")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
              <Link href="#how-it-works">
                <PlayCircle className="size-4" />
                {t("action.howItWorks")}
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6"
          >
            {[
              { label: "Job postings in demo set", value: "40+" },
              { label: "Skills in the matcher", value: "50" },
              { label: "Agent tools", value: "8" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
                <dd className="font-display text-xl font-bold">
                  {stat.value}
                  <span className="ml-1 align-middle text-[9px] font-semibold uppercase text-secondary">
                    demo
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ------------------------------ visual ----------------------------- */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative rounded-2xl border border-border bg-card/70 p-4 shadow-[var(--shadow-lift)] backdrop-blur-sm sm:p-5"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="size-3.5 text-primary" />
                How GramSkill AI works
              </span>
              <span className="flex gap-1" aria-hidden>
                {["bg-destructive/60", "bg-warning/70", "bg-success/60"].map((c) => (
                  <span key={c} className={cn("size-2.5 rounded-full", c)} />
                ))}
              </span>
            </div>

            <ol className="mt-4 space-y-2.5">
              {PIPELINE.map((step, index) => (
                <motion.li
                  key={step.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.09 }}
                  className="group relative flex items-center gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <step.icon className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{step.detail}</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    0{index + 1}
                  </span>
                </motion.li>
              ))}
            </ol>

            {/* progress rail with travelling pulse */}
            <span
              className="pointer-events-none absolute bottom-6 left-[2.15rem] top-24 w-px overflow-hidden bg-border"
              aria-hidden
            >
              <span className="block h-10 w-px bg-primary animate-[var(--animate-pipeline)]" />
            </span>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
              <Bot className="size-4 shrink-0 text-secondary" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Try it:</strong> “Find accounting jobs within 30 km of my
                location.” The agent plans, calls tools and explains the result.
              </p>
            </div>
          </motion.div>

          {/* floating stat cards */}
          {FLOATERS.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.12 }}
              className={cn(
                "absolute hidden max-w-[10.5rem] rounded-xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-lift)] lg:block",
                card.position,
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <card.icon
                  className={cn(
                    "size-3",
                    card.tone === "primary" && "text-primary",
                    card.tone === "secondary" && "text-secondary",
                    card.tone === "warning" && "text-warning",
                    card.tone === "success" && "text-success",
                  )}
                />
                {card.label}
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <span className="font-display text-sm font-bold">{card.value}</span>
                <span className="rounded bg-secondary/10 px-1 text-[8px] font-bold uppercase text-secondary">
                  demo
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
