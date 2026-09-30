import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, Server, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatRow } from "@/components/landing/sections";
import { DemoBadge, InlineDemoNote } from "@/components/shared/brand";
import { computeAnalytics } from "@/lib/server/analytics";

export const metadata: Metadata = { title: "About" };

const STACK = [
  {
    icon: Layers,
    title: "Frontend & API",
    items: ["Next.js 15 App Router", "TypeScript end to end", "Tailwind CSS + shadcn-style UI", "REST route handlers"],
  },
  {
    icon: Server,
    title: "Data & AI",
    items: ["PostgreSQL via Prisma (12+ models)", "Explainable matching engine", "Optional FastAPI ML service", "Deterministic agent planner + tool calling"],
  },
  {
    icon: ShieldCheck,
    title: "Trust & security",
    items: ["JWT httpOnly sessions", "bcrypt password hashing", "Zod validation on every input", "Rate-limited auth & agent routes"],
  },
];

export default async function AboutPage() {
  const analytics = await computeAnalytics();

  return (
    <div className="pb-16">
      <section className="decorative-gradient border-b border-border">
        <div className="container-page py-14 sm:py-20">
          <Badge variant="default" className="mb-4">
            About the project
          </Badge>
          <h1 className="text-balance max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Employment infrastructure for the villages that job portals forgot
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            GramSkill AI is an AI-based rural skill matching and employment system. It takes a plain-language
            profile — what you can do, where you live and what you want to become — and turns it into ranked
            opportunities, a concrete learning path and hands-on help applying.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <DemoBadge long />
            <Button asChild size="lg">
              <Link href="/login?demo=1">
                Explore Demo <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-bold tracking-tight">The problem we designed for</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Skills are invisible",
              body: "Rural candidates hold real, employable skills — bookkeeping, electrical work, tailoring, farming — that never appear in a formal resume, so screeners never see them.",
            },
            {
              title: "Geography excludes people",
              body: "Most job platforms rank by metro proximity. A candidate who cannot relocate is filtered out before a human ever looks at the application.",
            },
            {
              title: "Advice is generic",
              body: "“Improve communication skills” is not actionable. A learner needs to know which specific gap blocks which specific job, and how long closing it takes.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{item.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40 py-14">
        <div className="container-page">
          <h2 className="font-display text-2xl font-bold tracking-tight">What this build contains</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Everything below is implemented and running — not a slide deck. Numbers come from the active demo
            dataset.
          </p>
          <div className="mt-8">
            <StatRow
              items={[
                { label: "Fictional job postings", value: analytics.totals.jobs },
                { label: "Demo seeker profiles", value: analytics.totals.seekers },
                { label: "Applications tracked", value: analytics.totals.applications },
                { label: "Training programmes", value: analytics.totals.trainings },
              ]}
            />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {STACK.map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <group.icon className="size-5" />
                  </span>
                  <CardTitle className="pt-2">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <InlineDemoNote>
              <strong>Academic integrity note.</strong> Statistics on this page are computed from the bundled
              dataset, which is entirely fictional. No real employer, government programme or job seeker is
              represented. Coordinates are synthetic placeholders, not verified geocodes.
            </InlineDemoNote>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              <Sparkles className="size-5 text-primary" />
              Ready to see it in action?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The demo takes about three minutes to walk through end to end.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/login?demo=1">
              Explore Demo <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
