import type { Metadata } from "next";
import { AgentChat } from "@/components/agent/agent-chat";
import { welcomeMessage } from "@/lib/ai/agent/agent";
import { requireWorkspace } from "@/lib/server/workspace";
import type { AgentConversation } from "@/types";

export const metadata: Metadata = { title: "GramSkill AI Agent" };

/**
 * The agent page starts with a server-rendered welcome message so a demo never
 * shows an empty screen, then hands over to the client for the tool loop.
 */
export default async function AgentPage() {
  const workspace = await requireWorkspace();

  const conversation: AgentConversation = {
    id: `conv-${workspace.session.id}`,
    userId: workspace.session.id,
    title: "New conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [welcomeMessage(workspace.profile.name, workspace.profile.language === "hi")],
  };

  const matches = Object.fromEntries(workspace.matches.map((m) => [m.job.id, m]));
  const appliedJobIds = workspace.applications
    .filter((a) => a.status !== "SAVED")
    .map((a) => a.jobId);

  return (
    <AgentChat
      initialConversation={conversation}
      jobs={workspace.jobs}
      matches={matches}
      appliedJobIds={appliedJobIds}
    />
  );
}
