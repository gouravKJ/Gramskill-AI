"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Check,
  FileText,
  Info,
  Loader2,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/misc";
import { AiThinking, ToolTrace, TypingIndicator } from "@/components/shared/ai";
import { DemoBadge } from "@/components/shared/brand";
import { VoiceInput } from "@/components/shared/voice-input";
import { MatchBadge, SkillChip } from "@/components/shared/metrics";
import { JobCard } from "@/components/jobs/job-card";
import { ApplyWithAiDialog } from "@/components/jobs/apply-dialog";
import { WhyMatchDialog } from "@/components/jobs/why-match";
import { usePreferences } from "@/components/providers/app-providers";
import { cn, formatSalaryRange } from "@/lib/utils";
import { locationById, SKILL_BY_ID } from "@/lib/data/catalogue";
import type { ApiResult } from "@/lib/api/http";
import type { AgentConversation, AgentMessage, Job, JobMatch } from "@/types";

const STARTER_PROMPTS = [
  "Find accounting jobs within 30 km of my location.",
  "Find jobs matching my skills.",
  "Show jobs above ₹15,000.",
  "Which job is best matched to my skills?",
  "What skills am I missing?",
  "Find training for Tally.",
  "Help me apply for this job.",
  "Show my applications.",
  "Which interviews are coming up?",
];

/**
 * GramSkill AI Agent.
 *
 * The client is intentionally thin: it sends the message and renders whatever
 * the server-side agent loop returns — including the tool trace, so the
 * planning and execution are visible to the user rather than hidden.
 */
export function AgentChat({
  initialConversation,
  jobs,
  matches,
  appliedJobIds,
}: {
  initialConversation: AgentConversation;
  jobs: Job[];
  matches: Record<string, JobMatch>;
  appliedJobIds: string[];
}) {
  const router = useRouter();
  const { prefs, t } = usePreferences();
  const [conversation, setConversation] = React.useState(initialConversation);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [applyJobId, setApplyJobId] = React.useState<string | null>(null);
  const [whyJobId, setWhyJobId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const appliedIds = new Set(appliedJobIds);
  const jobMap = React.useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation.messages.length, thinking]);

  const send = React.useCallback(
    async (message: string, options: { approveActionId?: string; rejectActionId?: string } = {}) => {
      const text = message.trim();
      if (!text && !options.approveActionId && !options.rejectActionId) return;

      setInput("");
      setThinking(true);

      // Optimistic user bubble (skipped for approval clicks).
      if (!options.approveActionId && !options.rejectActionId) {
        setConversation((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: `local-${Date.now()}`,
              role: "user",
              content: text,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      }

      try {
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text || (options.approveActionId ? "Confirm and submit" : "Cancel"),
            conversationId: conversation.messages.length ? conversation.id : undefined,
            approveActionId: options.approveActionId,
            rejectActionId: options.rejectActionId,
            context: {
              simpleLanguage: prefs.simpleLanguage,
              language: prefs.language,
            },
          }),
        });

        const payload = (await response.json()) as ApiResult<{ conversation: AgentConversation }>;
        if (!payload.ok) throw new Error(payload.error);

        setConversation(payload.data.conversation);
        router.refresh();
      } catch (error) {
        toast.error("The assistant could not respond", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setThinking(false);
      }
    },
    [conversation.id, conversation.messages.length, prefs.language, prefs.simpleLanguage, router],
  );

  async function newConversation() {
    setConversation({
      id: `conv-${Math.random().toString(36).slice(2, 10)}`,
      userId: conversation.userId,
      title: "New conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });
    toast.success("Started a new conversation");
  }

  const applyJob = applyJobId ? jobMap.get(applyJobId) : null;
  const whyJob = whyJobId ? jobMap.get(whyJobId) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      {/* --------------------------------- chat ------------------------------ */}
      <Card className="flex h-[calc(100dvh-13rem)] min-h-[32rem] flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="size-5" />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-card" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-sm font-semibold">GramSkill AI Agent</h1>
            <p className="truncate text-xs text-muted-foreground">
              Your personal employment assistant · {conversation.messages.length} message
              {conversation.messages.length === 1 ? "" : "s"}
            </p>
          </div>
          <Badge variant="success" className="hidden gap-1 sm:flex">
            <span className="size-1.5 rounded-full bg-success" />
            Online
          </Badge>
          <Button variant="outline" size="icon-sm" onClick={newConversation} aria-label="New conversation">
            <MessageSquarePlus className="size-4" />
          </Button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {conversation.messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">
                  Namaste {conversation.title === "New conversation" ? "" : ""}🙏 I can help you find work.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask in plain language — English or Hindi. I search the demo job pool, explain every match and
                  prepare applications for your approval.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  >
                    <Sparkles className="mb-1 size-3 text-primary" />
                    <span className="block">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              jobMap={jobMap}
              matches={matches}
              appliedIds={appliedIds}
              onApply={setApplyJobId}
              onWhyMatch={setWhyJobId}
              onApprove={(actionId) => send("Confirm and submit", { approveActionId: actionId })}
              onReject={(actionId) => send("Cancel", { rejectActionId: actionId })}
              onQuickReply={send}
              thinking={thinking}
            />
          ))}

          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl"
              >
                <AiThinking
                  label={t("label.aiThinking")}
                  steps={["Detecting intent", "Planning tool calls", "Executing tools", "Writing the answer"]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-border p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={
                  prefs.simpleLanguage
                    ? "Type your question in simple words…"
                    : "e.g. Find accounting jobs within 30 km of my location"
                }
                rows={1}
                className="min-h-11 resize-none pr-3"
                aria-label="Message the assistant"
              />
            </div>
            <VoiceInput onTranscript={(text) => setInput((current) => `${current} ${text}`.trim())} />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send message">
              {thinking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3" />
            The assistant can search, explain and draft — it can never submit an application without your
            confirmation.
          </p>
        </div>
      </Card>

      {/* -------------------------------- sidebar ---------------------------- */}
      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-3 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-secondary" />
              What the agent can do
            </h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                { name: "searchJobs", text: "Free-text job search" },
                { name: "filterJobs", text: "Distance, salary and type filters" },
                { name: "getJobDetails", text: "Explain a specific match" },
                { name: "analyzeSkillGap", text: "List missing skills" },
                { name: "recommendTraining", text: "Build a learning path" },
                { name: "prepareApplication", text: "Draft an application (needs approval)" },
                { name: "trackApplication", text: "Show your pipeline" },
                { name: "getApplicationStatus", text: "Interviews and deadlines" },
              ].map((tool) => (
                <li key={tool.name} className="flex flex-col gap-0.5 rounded-lg bg-muted/50 px-2.5 py-2">
                  <code className="font-mono text-[10px] text-secondary">{tool.name}()</code>
                  <span>{tool.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Info className="size-4 text-primary" />
              How it works
            </h2>
            <ol className="space-y-1.5 text-[11px] text-muted-foreground">
              {[
                "Your message is analysed for intent",
                "A tool chain is planned",
                "Tools run against the live dataset",
                "Results are merged into one answer",
                "Anything that writes data waits for your approval",
              ].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-mono text-[10px]">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <Separator />
            <DemoBadge long />
          </CardContent>
        </Card>
      </aside>

      {applyJob && (
        <ApplyWithAiDialog
          job={applyJob}
          match={matches[applyJob.id] ?? null}
          open={Boolean(applyJobId)}
          onOpenChange={(open) => !open && setApplyJobId(null)}
          alreadyApplied={appliedIds.has(applyJob.id)}
        />
      )}

      {whyJob && matches[whyJob.id] && (
        <WhyMatchDialog
          job={whyJob}
          match={matches[whyJob.id]}
          open={Boolean(whyJobId)}
          onOpenChange={(open) => !open && setWhyJobId(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              message rendering                             */
/* -------------------------------------------------------------------------- */

function MessageBubble({
  message,
  jobMap,
  matches,
  appliedIds,
  onApply,
  onWhyMatch,
  onApprove,
  onReject,
  onQuickReply,
  thinking,
}: {
  message: AgentMessage;
  jobMap: Map<string, Job>;
  matches: Record<string, JobMatch>;
  appliedIds: Set<string>;
  onApply: (jobId: string) => void;
  onWhyMatch: (jobId: string) => void;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  onQuickReply: (text: string) => void;
  thinking: boolean;
}) {
  const isUser = message.role === "user";
  const jobs = (message.jobIds ?? []).map((id) => jobMap.get(id)).filter((job): job is Job => Boolean(job));

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
          isUser ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary",
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>

      <div className={cn("min-w-0 max-w-3xl flex-1 space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "w-fit max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-br-sm bg-secondary text-secondary-foreground"
              : "rounded-bl-sm border border-border bg-card",
          )}
        >
          <Markdownish text={message.content} />
        </div>

        {message.planSteps && message.planSteps.length > 0 && !isUser && (
          <details className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Agent reasoning ({message.planSteps.length} steps)
            </summary>
            <ol className="mt-2 space-y-1 text-muted-foreground">
              {message.planSteps.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-mono text-[10px]">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </details>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && <ToolTrace calls={message.toolCalls} />}

        {jobs.length > 0 && (
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {jobs.slice(0, 4).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                match={matches[job.id]}
                compact
                applied={appliedIds.has(job.id)}
                onWhyMatch={() => onWhyMatch(job.id)}
                onApply={() => onApply(job.id)}
              />
            ))}
          </div>
        )}

        {/* ------------------------ approval gate ------------------------- */}
        {message.requiresApproval && message.pendingActionId && (
          <ApprovalCard
            message={message}
            jobs={jobs}
            jobMap={jobMap}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}

        {message.quickReplies && message.quickReplies.length > 0 && !thinking && (
          <div className="flex flex-wrap gap-1.5">
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => onQuickReply(reply)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {thinking && !isUser && <TypingIndicator />}
      </div>
    </div>
  );
}

function ApprovalCard({
  message,
  jobs,
  jobMap,
  onApprove,
  onReject,
}: {
  message: AgentMessage;
  jobs: Job[];
  jobMap: Map<string, Job>;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
}) {
  const [reviewing, setReviewing] = React.useState(false);

  return (
    <div className="w-full rounded-xl border border-warning/40 bg-warning/5 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-warning">
        <FileText className="size-4" />
        Review Application
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The assistant has prepared a draft. Nothing has been submitted. Review it, then confirm — or cancel.
      </p>

      {reviewing && (
        <div className="mt-3 space-y-3">
          <div className="rounded-lg border border-border bg-card p-3 text-xs">
            <p className="font-medium">Application summary (demo)</p>
            <p className="mt-1 text-muted-foreground">
              Documents: profile details, skills list and the cover note drafted from your profile. In this
              prototype no file is uploaded and no email is sent.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Pressing Confirm records the application in the GramSkill database with status “Applied”.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setReviewing((v) => !v)}>
          {reviewing ? "Hide details" : "Review draft"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onReject(message.pendingActionId!)}>
          <X className="size-3.5" /> Cancel
        </Button>
        <Button size="sm" onClick={() => onApprove(message.pendingActionId!)}>
          <Check className="size-3.5" /> Confirm &amp; Submit
        </Button>
      </div>
    </div>
  );
}

/**
 * Minimal markdown-ish renderer. The agent only emits **bold**, bullet lists and
 * plain paragraphs, so a full markdown dependency would be overkill (and heavier
 * on a low-bandwidth connection).
 */
function Markdownish({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-1.5" aria-hidden />;
        const bullet = line.trimStart().startsWith("•") || line.trimStart().startsWith("-");
        const content = bullet ? line.trimStart().slice(1).trim() : line;
        return (
          <p key={index} className={cn(bullet && "flex gap-2 pl-1")}>
            {bullet && <span className="mt-2 size-1 shrink-0 rounded-full bg-current" aria-hidden />}
            <span>{renderBold(content)}</span>
          </p>
        );
      })}
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={index} className="italic opacity-80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export { MatchBadge, SkillChip, formatSalaryRange, locationById, SKILL_BY_ID };
