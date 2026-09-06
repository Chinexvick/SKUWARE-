"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({
  persona,
  title,
  placeholder,
  suggestions,
}: {
  persona: "STUDENT_TUTOR" | "TEACHER_ASSISTANT" | "PARENT_ASSISTANT" | "SCHOOL_ASSISTANT";
  title: string;
  placeholder: string;
  suggestions?: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona, message: text, conversationId }),
    });
    const data = await res.json();

    if (res.ok) {
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setNotConfigured(!data.configured);
    } else {
      setMessages((m) => [...m, { role: "assistant", content: data.error ?? "Something went wrong. Please try again." }]);
    }
    setSending(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <Card className="flex h-[32rem] flex-col">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">{title}</h2>

      {notConfigured && (
        <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
          AI features aren&apos;t fully configured for this deployment yet — responses may be limited until an AI
          provider key is set.
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-gray-500">Ask a question to get started.</p>
            {suggestions && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-black hover:text-black"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "ml-auto bg-black text-white" : "bg-brand-light text-black"}`}>
              {m.content}
            </div>
          ))
        )}
        {sending && <div className="max-w-[60%] rounded-xl bg-brand-light px-3.5 py-2.5 text-sm text-gray-400">Thinking…</div>}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
        />
        <Button type="submit" loading={sending} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}
