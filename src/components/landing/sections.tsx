"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  Landmark,
  MapPin,
  Mic,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WifiOff,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Counter } from "@/components/shared/metrics";
import { AiTag } from "@/components/shared/ai";
import { DemoBadge, InlineDemoNote } from "@/components/shared/brand";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                Trust strip                                 */
/* -------------------------------------------------------------------------- */

export function TrustStrip() {
  const items = [
    { icon: ShieldCheck, label: "Explainable matching", detail: "Every score shows its factors" },
    { icon: Languages, label: "Hindi + English", detail: "Simple-language mode included" },
    { icon: WifiOff, label: "Low-bandwidth mode", detail: "Works on 2G and low-end phones" },
    { icon: Mic, label: "Voice input", detail: "Speak instead of typing" },
  ];

  return (
    <section aria-label="Platform qualities" className="border-y border-border bg-card/50">
      <div className="container-page grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-xs text-muted-foreground">{item.detail}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Features                                  */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Job Matching",
    description: "Find jobs based on skills, education, experience and location.",
    detail: "Weighted scoring across six factors, with the weights exposed in the UI.",
    tone: "primary" as const,
  },
  {
    icon: Target,
    title: "Skill Gap Detection",
    description: "Identify missing skills required for your target jobs.",
    detail: "Gaps are ranked by employer demand, not alphabetically.",
    tone: "warning" as const,
  },
  {
    icon: GraduationCap,
    title: "Personalized Training",
    description: "Recommend courses based on the skill gaps we detect.",
    detail: "Learning paths ordered by quick wins, with projected match uplift.",
    tone: "secondary" as const,
  },
  {
    icon: Bot,
    title: "Agentic AI Assistant",
    description: "Search jobs and get assistance through the whole application process.",
    detail: "Eight tools, transparent reasoning trace, approval before any submission.",
    tone: "primary" as const,
  },
  {
    icon: FileText,
    title: "Application Tracking",
    description: "Track applications, interviews and deadlines in one board.",
    detail: "Kanban pipeline with interview reminders and next actions.",
    tone: "secondary" as const,
  },
  {
    icon: Compass,
    title: "Rural Opportunity Discovery",
    description: "Surface local, remote, apprenticeship and public-sector opportunities.",
    detail: "Distance-aware results, remote roles flagged for village candidates.",
    tone: "warning" as const,
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="Capabilities"
        title="Everything a rural job seeker needs, in one place"
        description="Six connected modules that turn a simple skill profile into a real employment pipeline."
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
          >
            <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-lift)]">
              <CardHeader>
                <span
                  className={cn(
                    "grid size-11 place-items-center rounded-xl transition-transform group-hover:scale-105",
                    feature.tone === "primary" && "bg-primary/10 text-primary",
                    feature.tone === "secondary" && "bg-secondary/10 text-secondary",
                    feature.tone === "warning" && "bg-warning/12 text-warning",
                  )}
                >
                  <feature.icon className="size-5" />
                </span>
                <CardTitle className="pt-1">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {feature.detail}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                How it works                                */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { icon: Users, title: "Create Profile", text: "Name, age, village or town and preferred language." },
  { icon: BrainCircuit, title: "Analyze Skills", text: "Skills, education and experience become a feature vector." },
  { icon: Target, title: "Detect Skill Gaps", text: "We compare you against real requirements for your target roles." },
  { icon: Briefcase, title: "Match Jobs", text: "Every posting is scored and ranked with reasons." },
  { icon: Bot, title: "Get AI Assistance", text: "Ask the agent to search, explain or prepare applications." },
  { icon: FileText, title: "Apply", text: "Review the AI draft, then confirm. Nothing is sent without you." },
  { icon: Route, title: "Track Application", text: "Saved → Applied → Interview → Selected, in one board." },
  { icon: TrendingUp, title: "Improve Skills", text: "Close gaps, raise your match score, unlock better roles." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-card/40 py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="How it works"
          title="A complete journey from skill to salary"
          description="Eight steps, each backed by a real part of the system — not a mock-up screen."
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="group relative rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="font-mono text-[11px] font-semibold text-secondary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-3 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <step.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-display text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              {index < STEPS.length - 1 && (
                <span
                  className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 place-items-center rounded-full border border-border bg-background lg:grid"
                  aria-hidden
                >
                  <ArrowRight className="size-2.5 text-muted-foreground" />
                </span>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                        From Skill to Employment pipeline                   */
/* -------------------------------------------------------------------------- */

const PIPELINE_STAGES = [
  { label: "PROFILE", icon: Users },
  { label: "AI ANALYSIS", icon: BrainCircuit },
  { label: "SKILL GAP", icon: Target },
  { label: "JOB MATCH", icon: Briefcase },
  { label: "AI ASSISTANT", icon: Bot },
  { label: "APPLICATION", icon: FileText },
  { label: "EMPLOYMENT", icon: CheckCircle2 },
];

export function PipelineSection() {
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="Positioning"
        title="From Skill to Employment"
        description="One animated pipeline that summarises the whole product. Every stage is a working feature in this build."
      />

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-background to-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          {PIPELINE_STAGES.map((stage, index) => (
            <li key={stage.label} className="flex flex-1 items-center gap-3 lg:flex-col">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 lg:flex-col lg:py-4 lg:text-center"
              >
                <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <stage.icon className="size-4" />
                  <span className="absolute inset-0 rounded-lg border border-primary/30 animate-[var(--animate-pulse-ring)]" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide">{stage.label}</span>
              </motion.div>
              {index < PIPELINE_STAGES.length - 1 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex shrink-0 items-center justify-center text-muted-foreground"
                  aria-hidden
                >
                  <ArrowRight className="hidden size-4 lg:block" />
                  <ArrowRight className="size-4 rotate-90 lg:hidden" />
                </motion.span>
              )}
            </li>
          ))}
        </ol>

        <InlineDemoNote>
          Illustrative flow. The skill-gap, matching, training and agent stages run against the bundled demo
          dataset of fictional employers.
        </InlineDemoNote>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Demo persona card                             */
/* -------------------------------------------------------------------------- */

export function DemoPersona() {
  return (
    <section className="border-y border-border bg-card/40 py-16 sm:py-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div>
          <Badge variant="demo" className="mb-4">
            Demo mode
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Explore the full flow with a ready-made profile
          </h2>
          <p className="mt-4 text-muted-foreground">
            One click signs you in as a demo user with skills, applications, training progress and an
            interview already scheduled — so you can see the AI analysis immediately.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login?demo=1">
                <Sparkles className="size-4" />
                Explore Demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Create my own profile</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Demo credentials are shown on the sign-in screen: <code className="rounded bg-muted px-1.5 py-0.5">ravi@gramskill.demo</code>{" "}
            / <code className="rounded bg-muted px-1.5 py-0.5">demo1234</code>
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/40">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                  RK
                </span>
                Ravi Kumar
              </CardTitle>
              <DemoBadge />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Education</dt>
                <dd className="mt-0.5 font-medium">Diploma in Commerce</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Location</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" /> Rural Odisha
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Skills</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {["Excel", "Accounting", "Communication", "Computer Basics"].map((skill) => (
                    <Badge key={skill} variant="muted">
                      {skill}
                    </Badge>
                  ))}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Career goal</dt>
                <dd className="mt-0.5 font-medium">
                  “I want to become an Accounts Assistant near my village.”
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-3 text-center">
              {[
                { label: "Match score", value: "82%" },
                { label: "Skill gaps", value: "Tally, GST" },
                { label: "Applications", value: "5 active" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-0.5 font-display text-sm font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Values shown are computed live from the demo dataset when you sign in — not hard-coded.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Insights preview                              */
/* -------------------------------------------------------------------------- */

export function InsightsPreview({
  insights,
  sampleSize,
  topSkills,
}: {
  insights: string[];
  sampleSize: { seekers: number; jobs: number; applications: number; trainings: number };
  topSkills: { label: string; count: number }[];
}) {
  return (
    <section id="insights" className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="AI insights"
        title="Insight generated from data, not from imagination"
        description="These sentences are produced by aggregating the records actually present in the active dataset."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Live insights
              </CardTitle>
              <CardDescription>Recomputed from the database on every request.</CardDescription>
            </div>
            <AiTag />
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.slice(0, 5).map((insight, index) => (
              <motion.p
                key={insight}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="flex gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {insight}
              </motion.p>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Sample size: {sampleSize.seekers} seeker profiles · {sampleSize.jobs} postings ·{" "}
              {sampleSize.applications} applications · {sampleSize.trainings} training programmes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-secondary" />
              Most requested skills
            </CardTitle>
            <CardDescription>Counted from required skills on every demo posting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSkills.slice(0, 6).map((skill, index) => {
              const max = topSkills[0]?.count || 1;
              return (
                <div key={skill.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{skill.label}</span>
                    <span className="tabular-nums text-muted-foreground">{skill.count} jobs</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-secondary"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(skill.count / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: index * 0.05 }}
                    />
                  </div>
                </div>
              );
            })}
            <DemoBadge className="mt-2" long />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Government section                             */
/* -------------------------------------------------------------------------- */

const PUBLIC_CATEGORIES = [
  { icon: Landmark, title: "Government Jobs", detail: "District administration, India Post, health missions." },
  { icon: Route, title: "Apprenticeships", detail: "Paid, scheme-backed training with a completion certificate." },
  { icon: GraduationCap, title: "Skill Development", detail: "NSQF-aligned short courses, mostly free to enrol." },
  { icon: Building2, title: "Local Employment", detail: "Cooperative and MSME roles close to home." },
  { icon: TrendingUp, title: "Self-Employment", detail: "Micro-enterprise support with training and hand-holding." },
];

export function PublicOpportunities() {
  return (
    <section className="border-y border-border bg-card/40 py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Public &amp; community"
          title="Public &amp; Community Opportunities"
          description="Beyond private employers, GramSkill AI surfaces the schemes and programmes rural candidates most often miss."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PUBLIC_CATEGORIES.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-secondary/40"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <category.icon className="size-4" />
              </span>
              <h3 className="mt-3 font-display text-sm font-semibold">{category.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{category.detail}</p>
            </motion.div>
          ))}
        </div>

        <InlineDemoNote>
          Category examples are illustrative. Programme names, employers and numbers in this build are
          fictional demo records and should be verified against official sources before real use.
        </InlineDemoNote>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    FAQ                                     */
/* -------------------------------------------------------------------------- */

const FAQS = [
  {
    q: "Is the AI making decisions about my applications?",
    a: "No. The agent can search, rank, explain and draft. It cannot submit anything: every application must be reviewed on screen and confirmed by you, and the API rejects any request without an explicit confirmation flag.",
  },
  {
    q: "How does the match score work?",
    a: "Six weighted factors — skills, education, experience, location, preferences and text similarity — are combined into a 0–100 score. The breakdown is always visible in the 'Why This Match?' panel, so you can see exactly why a job ranked where it did.",
  },
  {
    q: "Does it work without internet or on a cheap phone?",
    a: "The interface is mobile-first with a bottom navigation bar, and low-bandwidth mode removes gradients, blur and heavy shadows. Voice input lets users speak instead of typing, and Hindi is available across the interface.",
  },
  {
    q: "Where does the job and training data come from?",
    a: "This academic build ships with a clearly labelled fictional dataset so the AI pipeline can be demonstrated end to end. The data layer is an interface — swapping in a real job board or government API requires no UI changes.",
  },
  {
    q: "Can the AI models be replaced?",
    a: "Yes. Matching runs behind a modular engine, and an optional Python FastAPI service (Random Forest / XGBoost / Sentence Transformers) can be enabled with one environment variable. The app falls back automatically when it is unavailable.",
  },
];

export function FaqSection() {
  return (
    <section className="container-page py-16 sm:py-20">
      <SectionHeading
        eyebrow="Questions"
        title="Frequently asked"
        description="The design decisions that matter most for a rural employment platform."
      />
      <Accordion type="single" collapsible className="mt-8 space-y-3">
        {FAQS.map((faq, index) => (
          <AccordionItem key={faq.q} value={`faq-${index}`} className="shadow-[var(--shadow-soft)]">
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent>{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    CTA                                     */
/* -------------------------------------------------------------------------- */

export function CtaSection() {
  return (
    <section className="container-page pb-20">
      <div className="decorative-gradient relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[var(--shadow-soft)] sm:px-12">
        <h2 className="text-balance mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Empowering rural talent through AI.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          See the complete journey — profile, AI analysis, skill gaps, job matches, agent assistance,
          applications and training — in under five minutes.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="xl">
            <Link href="/login?demo=1">
              <Sparkles className="size-4" />
              Explore Demo
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href="/register">
              Create free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex justify-center">
          <DemoBadge long />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Shared heading                                */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      )}
      <h2 className="text-balance mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </div>
  );
}

/* Small stat row used on the About page */
export function StatRow({ items }: { items: { label: string; value: number; suffix?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-card p-5">
          <p className="font-display text-3xl font-bold tabular-nums">
            <Counter value={item.value} suffix={item.suffix} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export { Compass, Sparkles };
