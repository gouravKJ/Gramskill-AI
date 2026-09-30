import type { AgentToolName } from "@/types";

/**
 * Optional LLM layer for the agentic assistant.
 *
 * The product is fully functional without any LLM (the planner + tools are
 * deterministic). When `LLM_PROVIDER` + an API key are configured we additionally
 * ask a chat model to phrase the final answer in natural language, given the
 * tool results. If the call fails or times out we silently fall back to the
 * templated reply, so a demo never breaks in front of an evaluator.
 *
 * Uses the OpenAI-compatible Chat Completions shape, which also covers Groq,
 * Together, OpenRouter and local Ollama/vLLM endpoints via OPENAI_BASE_URL.
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function isLlmConfigured() {
  return Boolean(process.env.LLM_PROVIDER && process.env.OPENAI_API_KEY);
}

export async function llmComplete(
  messages: LlmMessage[],
  options: { temperature?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  if (!isLlmConfigured()) return null;

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: 500,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("[llm] request failed", response.status, await response.text().catch(() => ""));
      return null;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (error) {
    console.warn("[llm] unavailable, using deterministic reply", (error as Error).message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** System prompt used when an LLM is available (kept here for transparency). */
export function agentSystemPrompt(options: { language: "en" | "hi"; simple: boolean }) {
  const { language, simple } = options;
  return [
    "You are GramSkill AI Agent, an employment assistant for rural job seekers in India.",
    "You are given the user's profile summary and the results of tool calls that already ran.",
    "Rules:",
    "- Never invent jobs, salaries or statistics. Only use the tool results provided.",
    "- Never claim an application was submitted; applications always need the user's explicit confirmation.",
    "- Reply in at most 4 short sentences.",
    simple ? "- Use very simple words suitable for low digital literacy. Avoid jargon." : "- Be concise and practical.",
    language === "hi" ? "- Reply in Hindi (Devanagari script)." : "- Reply in English.",
  ].join("\n");
}

export function toolTraceForPrompt(
  calls: { name: AgentToolName; summary: string }[],
): string {
  return calls.map((c) => `- ${c.name}: ${c.summary}`).join("\n");
}
