/**
 * Thin wrapper over the Anthropic Messages API. Configure by setting
 * ANTHROPIC_API_KEY in the environment (see .env.example). Every AI
 * feature in the product (student tutor, teacher/parent assistants,
 * question generation) goes through this single function so the provider
 * can be swapped or the calls centrally rate-limited/logged later.
 *
 * When no key is configured, callers get a clearly-labeled "not configured"
 * result instead of a fabricated response — the UI is expected to show
 * that state honestly rather than pretend the AI answered.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICompletionResult {
  ok: boolean;
  text: string;
  error?: string;
}

export function isAIConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function getAICompletion(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: { maxTokens?: number },
): Promise<AICompletionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      text: "AI features are not yet configured for this school. Ask your platform administrator to set ANTHROPIC_API_KEY.",
      error: "not_configured",
    };
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: options?.maxTokens ?? 1024,
        system: systemPrompt,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[ai] provider error", res.status, body);
      return { ok: false, text: "The AI service could not process this request right now. Please try again shortly.", error: "provider_error" };
    }

    const data = await res.json();
    const text = Array.isArray(data.content)
      ? data.content.map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : "")).join("")
      : "";

    return { ok: true, text: text || "I wasn't able to generate a response. Please rephrase your question." };
  } catch (err) {
    console.error("[ai] request failed", err);
    return { ok: false, text: "The AI service is temporarily unreachable. Please try again shortly.", error: "network_error" };
  }
}

/** Extracts the first JSON array/object found in a model response, tolerating surrounding prose or code fences. */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const closingChar = candidate[start] === "[" ? "]" : "}";
  const end = candidate.lastIndexOf(closingChar);
  if (end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
