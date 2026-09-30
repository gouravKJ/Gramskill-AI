import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, BrainCircuit, FileText, Target, TrendingUp, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineSection } from "@/components/landing/sections";
import { AiThinking } from "@/components/shared/ai";
import { InlineDemoNote } from "@/components/shared/brand";

export const metadata: Metadata = { title: "How It Works" };

const TOOLS = [
  { name: "searchJobs", detail: "Free-text search across title, employer, sector and description." },
  { name: "filterJobs", detail: "Distance, salary, job type, work mode and skill filters." },
  { name: "getJobDetails", detail: "Full posting plus the match breakdown for that job." },
  { name: "analyzeSkillGap", detail: "Missing skills, ranked by employer demand." },
  { name: "recommendTraining", detail: "Ordered learning path with projected match uplift." },
  { name: "prepareApplication", detail: "Drafts a cover note — always awaits your approval." },
  { name: "trackApplication", detail: "Applications grouped by pipeline status." },
  { name: "getApplicationStatus", detail: "Upcoming interviews, deadlines and next actions." },
];

const LOOP = [
  "User Request",
  "Intent Detection",
  "Agent Planning",
  "Tool Selection",
  "Tool Execution",
  "Result Analysis",
  "User Response",
  "User Approval",
  "Action",
];

export default function HowItWorksPage() {
  return (
    <div className="pb-16">
      <section className="decorative-gradient border-b border-border">
        <div className="container-page py-14 text-center sm:py-20">
          <Badge variant="secondary" className="mb-4">
            Architecture
          </Badge>
          <h1 className="text-balance mx-auto max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How the AI actually works, end to end
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            No black box: the matching model, the skill-gap engine and the agent's tool calls are all
            visible in the interface.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login?demo=1">
                Explore the live demo <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: Users,
              title: "1 · Profile becomes a feature vector",
              body: "Skills with proficiency, education level, experience band, location coordinates and preferences are normalised into the features the matcher scores against.",
            },
            {
              icon: BrainCircuit,
              title: "2 · Weighted, explainable scoring",
              body: "Skills 42% · Location 16% · Education 14% · Experience 12% · Preferences 10% · Semantic similarity 6%. Every factor and its contribution is shown to the user.",
            },
            {
              icon: Target,
              title: "3 · Gaps ranked by demand",
              body: "A skill demanded as REQUIRED by your best-matching jobs outranks one that appears as optional elsewhere — so the learning path always starts where it pays off most.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </span>
                <CardTitle className="pt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{item.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <PipelineSection />

      <section className="border-y border-border bg-card/40 py-14">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              The agentic loop
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every message is planned, executed through real tools, and summarised. Tool calls, their inputs
              and their results are shown inline in the chat so the reasoning is auditable.
            </p>
            <div className="mt-5">
              <AiThinking steps={["Detecting intent", "Planning tool chain", "Executing tools", "Composing answer"]} />
            </div>
            <InlineDemoNote>
              With no LLM key configured, the deterministic planner runs — which is what happens in the demo.
              Adding an OpenAI-compatible endpoint only changes how the final sentence is phrased; the tool
              results are identical.
            </InlineDemoNote>
          </div>

          <div className="flex flex-col gap-2">
            {LOOP.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{step}</span>
                {step === "User Approval" && (
                  <Badge variant="warning" className="ml-auto">
                    Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
            <Wrench className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Agent tool catalogue</h2>
            <p className="text-sm text-muted-foreground">
              Eight tools, each with an explicit input contract — the same shape an LLM tool-calling loop expects.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <div key={tool.name} className="rounded-xl border border-border bg-card p-4">
              <code className="rounded bg-secondary/10 px-1.5 py-0.5 font-mono text-[11px] text-secondary">
                {tool.name}()
              </code>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tool.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-warning" />
                Never auto-submit
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">prepareApplication()</code>{" "}
              returns a draft and creates a pending approval record. Only an explicit
              <strong className="text-foreground"> Confirm &amp; Submit</strong> creates an application, and the
              REST endpoint rejects any payload without <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">confirmed: true</code>.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" />
                Replaceable ML layer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Set <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">ML_SERVICE_URL</code> and the
              Python service (Random Forest / XGBoost / Sentence Transformers) is used for scoring, with an
              automatic fallback to the TypeScript engine if it is unreachable.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container-page pb-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <Bot className="size-8 text-primary" />
          <h2 className="font-display text-2xl font-bold tracking-tight">Try the agent yourself</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Ask it to find jobs near you, explain a match, list missing skills, build a learning path, or
            prepare an application for your review.
          </p>
          <Button asChild size="lg">
            <Link href="/login?demo=1">
              Open the AI Job Assistant <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
