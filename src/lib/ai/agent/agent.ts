import { AGENT_TOOLS, type AgentToolContext, type ToolResult } from "@/lib/ai/agent/tools";
import { plan } from "@/lib/ai/agent/planner";
import { agentSystemPrompt, isLlmConfigured, llmComplete, toolTraceForPrompt } from "@/lib/ai/llm";
import { locationById, SKILL_BY_ID } from "@/lib/data/catalogue";
import { formatDate, formatINR, formatSalaryRange, relativeDays } from "@/lib/utils";
import type {
  AgentAction,
  AgentConversation,
  AgentMessage,
  AgentToolCall,
  Application,
  Job,
  JobMatch,
  LanguageCode,
} from "@/types";

/**
 * Agent runtime.
 *
 * Implements the documented agentic loop:
 *   user request → intent detection → planning → tool selection → tool execution
 *   → result analysis → response → user approval → action
 *
 * The approval gate is enforced here, not in the UI: `prepareApplication`
 * produces a *draft* only, and the only code path that writes an Application
 * row is the explicit approve branch below.
 */

export interface RunAgentParams {
  message: string;
  conversation: AgentConversation;
  context: AgentToolContext;
  userName: string;
  language?: LanguageCode;
  simpleLanguage?: boolean;
  activeJobId?: string | null;
}

export interface RunAgentResult {
  conversation: AgentConversation;
  reply: AgentMessage;
  action?: AgentAction;
}

const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export function createConversation(userId: string): AgentConversation {
  return {
    id: newId("conv"),
    userId,
    title: "New conversation",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    messages: [],
  };
}

export function welcomeMessage(userName: string, simple = false): AgentMessage {
  return {
    id: newId("msg"),
    role: "assistant",
    content: simple
      ? `Namaste ${userName}. I help you find work. Ask me: jobs near me, jobs for my skills, what should I learn, or help me apply.`
      : `Namaste ${userName} 🙏 I'm your GramSkill AI employment assistant. I can search jobs near you, explain why a job matches, show the skills you're missing, recommend training, and prepare an application for your review.`,
    createdAt: nowIso(),
    quickReplies: [
      "Find jobs near me",
      "Find jobs matching my skills",
      "What skills am I missing?",
      "Which job is best matched to my skills?",
      "Find training for Tally",
      "Show my applications",
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*                             reply composition                              */
/* -------------------------------------------------------------------------- */

interface ReplyBundle {
  content: string;
  jobIds: string[];
  quickReplies: string[];
  requiresApproval: boolean;
  pendingActionId?: string;
  pendingApplicationJobId?: string;
}

function composeReply(
  params: RunAgentParams,
  toolCalls: AgentToolCall[],
  results: { name: string; result: ToolResult }[],
  actionId: string | undefined,
): ReplyBundle {
  const { simpleLanguage, context } = params;
  const lines: string[] = [];
  const jobIds = new Set<string>();
  let requiresApproval = false;
  let pendingApplicationJobId: string | undefined;

  for (const { name, result } of results) {
    if (result.jobIds) result.jobIds.forEach((id) => jobIds.add(id));
    if (name === "filterJobs" || name === "searchJobs") {
      lines.push(renderJobList(result, context.jobs, simpleLanguage));
    } else if (name === "getJobDetails") {
      lines.push(renderJobDetail(result));
    } else if (name === "analyzeSkillGap") {
      lines.push(renderSkillGap(result, simpleLanguage));
    } else if (name === "recommendTraining") {
      lines.push(renderTraining(result));
    } else if (name === "prepareApplication") {
      requiresApproval = Boolean(result.requiresApproval);
      pendingApplicationJobId = (result.pendingDetails?.jobId as string) ?? undefined;
      lines.push(renderApplicationDraft(result));
    } else if (name === "trackApplication") {
      lines.push(renderApplications(result));
    } else if (name === "getApplicationStatus") {
      lines.push(renderUpcoming(result));
    }
  }

  const content = lines.filter(Boolean).join("\n\n") || "I could not find anything for that request. Try asking about jobs, skills or training.";

  if (simpleLanguage) {
    return { content: `${content}`, jobIds: [...jobIds], quickReplies: defaultQuickReplies(simpleLanguage), requiresApproval, pendingActionId: actionId, pendingApplicationJobId };
  }

  return {
    content,
    jobIds: [...jobIds],
    quickReplies: defaultQuickReplies(false),
    requiresApproval,
    pendingActionId: actionId,
    pendingApplicationJobId,
  };
}

function defaultQuickReplies(simple?: boolean) {
  return simple
    ? ["Jobs near me", "What should I learn?", "Show my applications"]
    : ["Why this match?", "What skills am I missing?", "Find training for Tally", "Show my applications"];
}

function renderJobList(result: ToolResult, jobs: Job[], simple?: boolean) {
  if (!result.matches?.length) return result.summary;
  const header = simple
    ? `I found ${result.matches.length} jobs. Here they are:`
    : result.summary;
  const lines = result.matches.slice(0, 5).map((m, i) => {
    const job = m.job;
    const location = locationById(job.locationId).name;
    const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
    if (simple) {
      return `${i + 1}. ${job.title} — ${location}. Pay ${salary} per month. Good match: ${m.score}%.`;
    }
    return `${i + 1}. **${job.title}** — ${job.company}, ${location}. ${salary}/month · ${m.score}% match${
      m.missingSkills.length ? ` · missing: ${m.missingSkills.join(", ")}` : " · you meet all listed skills"
    }.`;
  });
  const tail =
    result.matches.length > 5 ? `\n\n...and ${result.matches.length - 5} more in the list below.` : "";
  return `${header}\n\n${lines.join("\n")}${tail}`;
}

function renderJobDetail(result: ToolResult) {
  const data = result.data as { job: Job; match: JobMatch } | undefined;
  if (!data) return result.summary;
  const { job, match } = data;
  const reasons = match.explanation.reasons.slice(0, 4).map((r) => `✓ ${r}`);
  const gaps = match.explanation.gaps.map((g) => `⚠ ${g}`);
  return [
    `**${job.title}** at ${job.company} — ${match.score}% match.`,
    job.description,
    ...reasons,
    ...gaps,
    match.explanation.suggestions.length ? `Next step: ${match.explanation.suggestions[0]}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSkillGap(result: ToolResult, simple?: boolean) {
  const report = result.data as
    | {
        gaps: { skillName: string; importance: string; estimatedWeeks: number }[];
        coverage: number;
        targetJob: Job | null;
      }
    | undefined;
  if (!report) return result.summary;
  if (!report.gaps.length) {
    return "Good news — you already cover every required skill in your top matching jobs.";
  }
  const header = simple
    ? `You need to learn ${report.gaps.length} things:`
    : `You are missing ${report.gaps.length} skill${report.gaps.length > 1 ? "s" : ""} for ${
        report.targetJob?.title ?? "your target roles"
      } (you currently cover ${report.coverage}% of required skills):`;
  const lines = report.gaps.map(
    (g) =>
      `⚠ **${g.skillName}** — ${g.importance.toLowerCase()}, about ${g.estimatedWeeks} week${
        g.estimatedWeeks > 1 ? "s" : ""
      } to learn`,
  );
  return `${header}\n\n${lines.join("\n")}`;
}

function renderTraining(result: ToolResult) {
  const data = result.data as
    | { path: { steps: { training: { title: string; provider: string; durationWeeks: number; cost: number } }[]; totalWeeks: number; projectedMatchScore: number } }
    | undefined;
  if (!data?.path?.steps?.length) return result.summary;
  const lines = data.path.steps.map(
    (s, i) =>
      `${i + 1}. **${s.training.title}** — ${s.training.provider}, ${s.training.durationWeeks} weeks, ${
        s.training.cost === 0 ? "free" : formatINR(s.training.cost)
      }`,
  );
  return `Here is your learning path (about ${data.path.totalWeeks} weeks total). Completing it could raise your best match score to roughly ${data.path.projectedMatchScore}%:\n\n${lines.join("\n")}`;
}

function renderApplicationDraft(result: ToolResult) {
  const details = result.pendingDetails as
    | { missingRequired?: string[]; missingProfileFields?: string[]; checklist?: string[]; coverNote?: string }
    | undefined;
  const lines = [
    "I prepared a **draft application** — nothing has been submitted yet.",
    details?.checklist?.length ? `Checklist: ${details.checklist.map((c) => `✓ ${c}`).join(" ")}` : "",
    details?.missingRequired?.length ? `⚠ Still missing required skills: ${details.missingRequired.join(", ")}` : "",
    details?.missingProfileFields?.length
      ? `⚠ Please add: ${details.missingProfileFields.join(", ")}`
      : "",
    "Review the draft below, then press **Confirm & Submit** to record it (this is a demo submission).",
  ];
  return lines.filter(Boolean).join("\n");
}

function renderApplications(result: ToolResult) {
  const data = result.data as
    | { applications: (Application & { job?: Job })[] }
    | undefined;
  if (!data?.applications?.length) return result.summary;
  const lines = data.applications.slice(0, 6).map(
    (a) =>
      `• **${a.job?.title ?? "Job"}** — ${a.status.toLowerCase().replace("_", " ")} (applied ${formatDate(
        a.appliedAt,
      )})${a.interviewAt ? ` · interview ${formatDate(a.interviewAt)}` : ""}`,
  );
  return `${result.summary}\n\n${lines.join("\n")}`;
}

function renderUpcoming(result: ToolResult) {
  const data = result.data as
    | {
        upcoming: { id: string; interviewAt: string | null; jobId: string }[];
        deadlines: Job[];
        pendingActions: { nextAction: string; job?: Job }[];
      }
    | undefined;
  if (!data) return result.summary;
  const parts: string[] = [result.summary];
  if (data.upcoming.length) {
    parts.push(
      data.upcoming
        .map((u) => `📅 Interview ${formatDate(u.interviewAt)} (${relativeDays(u.interviewAt!)})`)
        .join("\n"),
    );
  }
  if (data.deadlines.length) {
    parts.push(
      data.deadlines
        .slice(0, 3)
        .map((j) => `⏳ ${j.title} closes ${formatDate(j.deadline)} (${relativeDays(j.deadline)})`)
        .join("\n"),
    );
  }
  if (data.pendingActions.length) {
    parts.push(`Next action: ${data.pendingActions[0].nextAction}`);
  }
  return parts.join("\n\n");
}

/* -------------------------------------------------------------------------- */
/*                                 runtime                                    */
/* -------------------------------------------------------------------------- */

export async function runAgentTurn(params: RunAgentParams): Promise<RunAgentResult> {
  const { conversation, context, message } = params;
  const language = params.language ?? "en";
  const simple = Boolean(params.simpleLanguage);

  const userMessage: AgentMessage = {
    id: newId("msg"),
    role: "user",
    content: message,
    createdAt: nowIso(),
  };

  const agentPlan = plan(message, {
    message,
    activeJobId: params.activeJobId ?? null,
  });

  // ---------------------------------------------------------------- help ----
  if (agentPlan.tools.length === 0) {
    const reply: AgentMessage = {
      id: newId("msg"),
      role: "assistant",
      content: simple
        ? "I can do these things: find jobs near you, find jobs for your skills, tell you what to learn, and help you apply. Ask me one of these."
        : [
            "Here is what I can do for you:",
            "",
            "• **Find jobs** — \"Find accounting jobs within 30 km of my location\"",
            "• **Skill-based matching** — \"Find jobs matching my skills\"",
            "• **Salary filter** — \"Show jobs above ₹15,000\"",
            "• **Best match** — \"Which job is best matched to my skills?\"",
            "• **Skill gaps** — \"What skills am I missing?\"",
            "• **Training** — \"Find training for Tally\"",
            "• **Apply** — \"Help me apply for this job\" (I always ask for your approval first)",
            "• **Tracking** — \"Show my applications\" / \"Which interviews are coming up?\"",
          ].join("\n"),
      createdAt: nowIso(),
      planSteps: agentPlan.steps,
      quickReplies: defaultQuickReplies(simple),
    };
    return finish(conversation, userMessage, reply);
  }

  // ------------------------------------------------------- execute tools ----
  const toolCalls: AgentToolCall[] = [];
  const toolResults: { name: string; result: ToolResult }[] = [];

  for (const step of agentPlan.tools) {
    const tool = AGENT_TOOLS[step.name];
    const started = Date.now();
    // `prepareApplication` receives the job resolved by the previous step.
    const input = resolveToolInput(step.name, step.input, params, toolResults);
    const result = await tool.execute(context, input);
    toolCalls.push({
      id: newId("tool"),
      name: tool.name,
      label: step.label || tool.label,
      input,
      status: result.requiresApproval ? "AWAITING_APPROVAL" : "DONE",
      resultSummary: result.summary,
      durationMs: Date.now() - started,
    });
    toolResults.push({ name: step.name, result });
  }

  // ------------------------------------------------- approval bookkeeping ---
  const approvalResult = toolResults.find((r) => r.result.requiresApproval);
  let action: AgentAction | undefined;
  if (approvalResult) {
    action = {
      id: newId("act"),
      conversationId: conversation.id,
      userId: conversation.userId,
      tool: "prepareApplication" as const,
      input: (approvalResult.result.pendingDetails ?? {}) as Record<string, unknown>,
      outputSummary: approvalResult.result.summary,
      status: "PENDING_APPROVAL",
      requiresApproval: true,
      createdAt: nowIso(),
    };
  }

  const bundle = composeReply(params, toolCalls, toolResults, action?.id);

  // --------------------------------------------- optional LLM phrasing -----
  let content = bundle.content;
  if (isLlmConfigured()) {
    const polished = await llmComplete([
      { role: "system", content: agentSystemPrompt({ language, simple }) },
      {
        role: "user",
        content: [
          `User request: ${message}`,
          `User profile: ${params.context.profile.name}, based in ${
            locationById(params.context.profile.locationId).name
          }, skills: ${params.context.profile.skills.map((s) => SKILL_BY_ID.get(s.skillId)?.name ?? s.skillId).join(", ")}.`,
          `Tool results:\n${toolTraceForPrompt(toolResults.map((r) => ({ name: r.name as never, summary: r.result.summary })))}`,
          `Draft answer (rewrite naturally, keep every fact):\n${bundle.content}`,
        ].join("\n\n"),
      },
    ]);
    if (polished) content = polished;
  }

  const reply: AgentMessage = {
    id: newId("msg"),
    role: "assistant",
    content,
    createdAt: nowIso(),
    toolCalls,
    planSteps: agentPlan.steps,
    jobIds: bundle.jobIds,
    quickReplies: bundle.quickReplies,
    requiresApproval: bundle.requiresApproval,
    pendingActionId: bundle.pendingActionId,
    pendingJobId: bundle.pendingApplicationJobId,
  };

  const result = finish(conversation, userMessage, reply);
  return action ? { ...result, action } : result;
}

function resolveToolInput(
  name: string,
  input: Record<string, unknown>,
  params: RunAgentParams,
  previous: { name: string; result: ToolResult }[],
): Record<string, unknown> {
  const resolved = { ...input };
  if (name === "prepareApplication" && !resolved.jobId) {
    const narrowed =
      previous.find((p) => p.name === "getJobDetails" || p.name === "searchJobs" || p.name === "filterJobs")
        ?.result.matches?.[0]?.job.id ??
      previous.find((p) => p.result.jobIds?.length)?.result.jobIds?.[0] ??
      params.activeJobId;
    if (narrowed) resolved.jobId = narrowed;
  }
  if (name === "getJobDetails" && !resolved.jobId) {
    resolved.jobId = params.activeJobId ?? undefined;
  }
  return resolved;
}

function finish(
  conversation: AgentConversation,
  userMessage: AgentMessage,
  reply: AgentMessage,
): { conversation: AgentConversation; reply: AgentMessage } {
  const title =
    conversation.messages.length === 0
      ? userMessage.content.slice(0, 48)
      : conversation.title;
  const updated: AgentConversation = {
    ...conversation,
    title,
    updatedAt: nowIso(),
    messages: [...conversation.messages, userMessage, reply],
  };
  return { conversation: updated, reply };
}

/** Approve a pending application draft and record it as submitted (demo). */
export function approvalReplyFor(pendingJob: Job, approved: boolean, simple?: boolean): AgentMessage {
  if (!approved) {
    return {
      id: newId("msg"),
      role: "assistant",
      content: simple
        ? "Okay, I did not send it. Your draft is saved."
        : "Understood — nothing was submitted. I've kept the draft, so you can review it and submit whenever you're ready.",
      createdAt: nowIso(),
      quickReplies: defaultQuickReplies(simple),
    };
  }
  return {
    id: newId("msg"),
    role: "assistant",
    content: simple
      ? `Done. I saved your application for ${pendingJob.title}. Status is now "Applied". You can see it in your applications.`
      : [
          `✅ Application recorded for **${pendingJob.title}** at ${pendingJob.company}.`,
          "",
          "Status is now **Applied** — you can follow it in the Application Tracker.",
          "_(This is a demo submission: no real employer was contacted.)_",
        ].join("\n"),
    createdAt: nowIso(),
    quickReplies: ["Show my applications", "Which interviews are coming up?", "Find jobs near me"],
  };
}
