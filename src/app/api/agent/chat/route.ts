import { requireWorkspace } from "@/lib/server/workspace";
import { enforceRateLimit, fail, handler, ok } from "@/lib/api/http";
import { agentChatSchema } from "@/lib/validators";
import {
  approvalReplyFor,
  createConversation,
  runAgentTurn,
  welcomeMessage,
} from "@/lib/ai/agent/agent";
import type { AgentToolContext } from "@/lib/ai/agent/tools";
import type { AgentConversation } from "@/types";

export const dynamic = "force-dynamic";

function toolContext(workspace: Awaited<ReturnType<typeof requireWorkspace>>): AgentToolContext {
  return {
    profile: workspace.profile,
    jobs: workspace.jobs,
    training: workspace.training,
    applications: workspace.applications,
  };
}

/**
 * POST /api/agent/chat
 *
 * Runs one turn of the agentic loop. Two special inputs are supported:
 *   - `approveActionId` — the user pressed "Confirm & Submit" on a draft
 *   - `rejectActionId`   — the user pressed "Cancel"
 * Both are the only paths that can write an application from the agent.
 */
export const POST = handler(async (request: Request) => {
  const workspace = await requireWorkspace();
  enforceRateLimit(request, `agent:${workspace.session.id}`, { capacity: 30, refillPerSecond: 0.5 });

  const body = await request.json().catch(() => ({}));
  const input = agentChatSchema.parse(body);

  // ------------------------------------------------------ load conversation --
  let conversation: AgentConversation | null = input.conversationId
    ? await workspace.repo.getConversation(input.conversationId)
    : null;

  // An id that belongs to somebody else must never be resumable.
  if (conversation && conversation.userId !== workspace.session.id) {
    return fail("Conversation not found.", 404);
  }
  if (!conversation) {
    conversation = createConversation(workspace.session.id);
    conversation.messages = [welcomeMessage(workspace.profile.name, input.context?.simpleLanguage)];
  }

  /* ------------------------------- approvals ------------------------------ */
  if (input.approveActionId || input.rejectActionId) {
    const actionId = input.approveActionId ?? input.rejectActionId!;
    const actions = await workspace.repo.listAgentActions(workspace.session.id);
    const action = actions.find((a) => a.id === actionId);

    if (!action || action.status !== "PENDING_APPROVAL") {
      return fail("That action is no longer awaiting approval.", 409);
    }

    const jobId = String(action.input.jobId ?? "");
    const job = workspace.jobs.find((j) => j.id === jobId);
    if (!job) return fail("The job for that draft is no longer available.", 404);

    const approved = Boolean(input.approveActionId);

    if (approved) {
      await workspace.repo.createApplication({
        userId: workspace.session.id,
        jobId,
        status: "APPLIED",
        coverNote: String(action.input.coverNote ?? ""),
        nextAction: "Wait for the employer to respond; follow up after one week.",
      });
    }

    await workspace.repo.updateAgentAction(action.id, {
      status: approved ? "COMPLETED" : "REJECTED",
      outputSummary: approved
        ? `Application recorded for ${job.title} (demo submission).`
        : "Draft cancelled by the user.",
    });

    const reply = approvalReplyFor(job, approved, input.context?.simpleLanguage);
    const updated: AgentConversation = {
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: [...conversation.messages, reply],
    };
    const saved = await workspace.repo.saveConversation(updated);
    return ok({ conversation: saved, reply, actions: await workspace.repo.listAgentActions(workspace.session.id) });
  }

  /* ------------------------------ normal turn ----------------------------- */
  const result = await runAgentTurn({
    message: input.message,
    conversation,
    context: toolContext(workspace),
    userName: workspace.profile.name,
    language: input.context?.language ?? workspace.profile.language,
    simpleLanguage: input.context?.simpleLanguage,
    // "Help me apply for this job" needs a referent. When the UI does not supply
    // one we fall back to the user's best current match, and the reply names the
    // job so there is never any ambiguity about what was drafted.
    activeJobId: input.context?.jobId ?? workspace.matches[0]?.job.id ?? null,
  });

  const conversationWithAction = result.action
    ? await workspace.repo.createAgentAction(result.action).then(() => result.conversation)
    : result.conversation;

  const saved = await workspace.repo.saveConversation(conversationWithAction);

  return ok({
    conversation: saved,
    reply: result.reply,
    action: result.action ?? null,
  });
});

/** GET /api/agent/chat — recent conversations for the sidebar. */
export const GET = handler(async () => {
  const workspace = await requireWorkspace();
  const [conversations, actions] = await Promise.all([
    workspace.repo.listConversations(workspace.session.id),
    workspace.repo.listAgentActions(workspace.session.id),
  ]);
  return ok({ conversations, actions });
});
