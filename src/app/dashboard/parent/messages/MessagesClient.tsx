"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface StaffMember {
  id: string;
  user: { id: string; firstName: string; lastName: string; role: string };
}
interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

export function MessagesClient() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch("/api/people/staff");
      const data = await res.json();
      if (res.ok) setStaff(data.staff);
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!recipientId) return;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/communication/messages?with=${recipientId}`);
      const data = await res.json();
      if (res.ok) setMessages(data.messages);
    }, 0);
    return () => clearTimeout(t);
  }, [recipientId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !recipientId) return;
    setSending(true);
    const res = await fetch("/api/communication/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, body: text }),
    });
    if (res.ok) {
      setText("");
      const refreshed = await fetch(`/api/communication/messages?with=${recipientId}`);
      const data = await refreshed.json();
      setMessages(data.messages);
    }
    setSending(false);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="h-fit">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Staff</h3>
        {loading ? (
          <LoadingSpinner size="sm" className="py-10" />
        ) : (
          <ul className="space-y-1">
            {staff.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setRecipientId(s.user.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    recipientId === s.user.id ? "bg-brand-yellow font-semibold text-black" : "hover:bg-brand-light"
                  }`}
                >
                  {s.user.lastName} {s.user.firstName}
                  <span className="block text-xs text-gray-500">{s.user.role.replace("_", " ")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex h-[28rem] flex-col lg:col-span-2">
        {!recipientId ? (
          <p className="m-auto text-sm text-gray-500">Select a staff member to start a conversation.</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.senderId === recipientId ? "bg-brand-light text-black" : "ml-auto bg-black text-white"}`}>
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet — say hello.</p>}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm"
              />
              <Button type="submit" loading={sending}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
