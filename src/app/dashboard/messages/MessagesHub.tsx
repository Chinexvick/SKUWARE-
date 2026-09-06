"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
}
interface Conversation {
  partner: DirectoryUser;
  lastBody: string;
  lastAt: string;
  unread: number;
}
interface DirectMessage {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}
interface Community {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}
interface CommunityMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

const ROLE_LABEL_SHORT: Record<string, string> = {
  SCHOOL_OWNER: "School Owner",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  BURSAR: "Bursar",
  TEACHER: "Teacher",
  STAFF: "Staff",
  PARENT: "Parent",
  STUDENT: "Student",
  GATE_STAFF: "Gate Staff",
};

function Avatar({ user, size = 36 }: { user: DirectoryUser; size?: number }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- data: URI avatar
    return <img src={user.avatarUrl} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-yellow font-bold text-black"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {user.firstName.charAt(0).toUpperCase()}
    </div>
  );
}

function DirectMessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<DirectoryUser[]>([]);
  const [active, setActive] = useState<DirectoryUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const res = await fetch("/api/communication/messages/conversations");
    if (res.ok) setConversations((await res.json()).conversations);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadConversations();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }
      const res = await fetch(`/api/people/directory?q=${encodeURIComponent(search)}`);
      if (res.ok) setSearchResults((await res.json()).users);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/communication/messages?with=${active.id}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(user: DirectoryUser) {
    setActive(user);
    setSearch("");
    setSearchResults([]);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    const res = await fetch("/api/communication/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: active.id, body: text }),
    });
    if (res.ok) {
      setText("");
      const refreshed = await fetch(`/api/communication/messages?with=${active.id}`);
      setMessages((await refreshed.json()).messages);
      loadConversations();
    }
    setSending(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="flex h-[32rem] flex-col p-0">
        <div className="border-b border-gray-100 p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anyone by name…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {search.trim() ? (
            searchResults.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No one found.</p>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => openConversation(u)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-brand-light"
                >
                  <Avatar user={u} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-black">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="block text-xs text-gray-500">{ROLE_LABEL_SHORT[u.role] ?? u.role}</span>
                  </span>
                </button>
              ))
            )
          ) : loading ? (
            <LoadingSpinner size="sm" className="py-10" />
          ) : conversations.length === 0 ? (
            <EmptyState pose="empty" title="No conversations yet" description="Search a name above to say hello." className="py-8" />
          ) : (
            conversations.map((c) => (
              <button
                key={c.partner.id}
                onClick={() => openConversation(c.partner)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                  active?.id === c.partner.id ? "bg-brand-yellow/20" : "hover:bg-brand-light"
                }`}
              >
                <Avatar user={c.partner} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-black">
                      {c.partner.firstName} {c.partner.lastName}
                    </span>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-black">
                        {c.unread}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-gray-500">{c.lastBody}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex h-[32rem] flex-col">
        {!active ? (
          <div className="m-auto">
            <EmptyState
              pose="wave"
              title="Say hello"
              description="Search for anyone in your school — a teacher, parent, student, or staff member — to start a conversation."
            />
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <Avatar user={active} />
              <div>
                <p className="text-sm font-semibold text-black">
                  {active.firstName} {active.lastName}
                </p>
                <p className="text-xs text-gray-500">{ROLE_LABEL_SHORT[active.role] ?? active.role}</p>
              </div>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.senderId === active.id ? "bg-brand-light text-black" : "ml-auto bg-black text-white"
                  }`}
                >
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet — say hello.</p>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
              />
              <Button type="submit" loading={sending} disabled={!text.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<DirectoryUser[]>([]);
  const [picked, setPicked] = useState<DirectoryUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) return setSearchResults([]);
      const res = await fetch(`/api/people/directory?q=${encodeURIComponent(search)}`);
      if (res.ok) setSearchResults((await res.json()).users);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function toggleCategory(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function addPerson(u: DirectoryUser) {
    if (!picked.some((p) => p.id === u.id)) setPicked((prev) => [...prev, u]);
    setSearch("");
    setSearchResults([]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Give the community a name.");
    setSaving(true);
    const res = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, categories, memberUserIds: picked.map((p) => p.id) }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(data.error ?? "Could not create community.");
    }
    onCreated();
  }

  const categoryOptions = [
    { key: "ALL_TEACHERS", label: "All Teachers" },
    { key: "ALL_PARENTS", label: "All Parents" },
    { key: "ALL_STUDENTS", label: "All Students" },
    { key: "ALL_STAFF", label: "All Staff" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Community</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JSS2 Parents"
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Description (optional)
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-black">Add by category</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => toggleCategory(c.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    categories.includes(c.key) ? "border-black bg-black text-white" : "border-gray-300 text-gray-600 hover:border-black"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-black">Add individuals</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
            />
            {searchResults.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                {searchResults.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => addPerson(u)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-light"
                  >
                    <Avatar user={u} size={24} />
                    {u.firstName} {u.lastName}
                    <span className="ml-auto text-xs text-gray-400">{ROLE_LABEL_SHORT[u.role] ?? u.role}</span>
                  </button>
                ))}
              </div>
            )}
            {picked.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {picked.map((p) => (
                  <span key={p.id} className="flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium">
                    {p.firstName} {p.lastName}
                    <button type="button" onClick={() => setPicked((prev) => prev.filter((x) => x.id !== p.id))} className="text-gray-400 hover:text-black">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create community
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function CommunitiesTab({ canCreate }: { canCreate: boolean }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [active, setActive] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/communities");
    if (res.ok) setCommunities((await res.json()).communities);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  useEffect(() => {
    if (!active) return;
    fetch(`/api/communities/${active.id}/messages`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    const res = await fetch(`/api/communities/${active.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      setText("");
      const refreshed = await fetch(`/api/communities/${active.id}/messages`);
      setMessages((await refreshed.json()).messages);
    }
    setSending(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="flex h-[32rem] flex-col p-0">
        <div className="flex items-center justify-between border-b border-gray-100 p-3">
          <span className="text-sm font-semibold text-black">Communities</span>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="text-xs font-semibold text-black underline underline-offset-2">
              + New
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner size="sm" className="py-10" />
          ) : communities.length === 0 ? (
            <EmptyState
              pose="empty"
              title="No communities yet"
              description={canCreate ? "Create a community to start a group chat." : "You're not in any communities yet."}
              className="py-8"
            />
          ) : (
            communities.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`flex w-full flex-col items-start px-3 py-2.5 text-left transition ${
                  active?.id === c.id ? "bg-brand-yellow/20" : "hover:bg-brand-light"
                }`}
              >
                <span className="text-sm font-semibold text-black">{c.name}</span>
                <span className="text-xs text-gray-500">{c._count.members} members</span>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex h-[32rem] flex-col">
        {!active ? (
          <div className="m-auto">
            <EmptyState pose="wave" title="Pick a community" description="Select a community to view its chat." />
          </div>
        ) : (
          <>
            <div className="mb-3 border-b border-gray-100 pb-3">
              <p className="text-sm font-semibold text-black">{active.name}</p>
              {active.description && <p className="text-xs text-gray-500">{active.description}</p>}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div key={m.id} className="max-w-[85%] rounded-2xl bg-brand-light px-3.5 py-2 text-sm text-black">
                  <p className="mb-0.5 text-xs font-semibold text-gray-500">
                    {m.sender.firstName} {m.sender.lastName}
                  </p>
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet — say hello.</p>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message the community…"
                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
              />
              <Button type="submit" loading={sending} disabled={!text.trim()}>
                Send
              </Button>
            </form>
          </>
        )}
      </Card>

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export function MessagesHub({ canCreateCommunity }: { canCreateCommunity: boolean }) {
  const [tab, setTab] = useState<"messages" | "communities">("messages");

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(["messages", "communities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "border-b-2 border-brand-yellow text-black" : "text-gray-500 hover:text-black"
            }`}
          >
            {t === "messages" ? "Direct Messages" : "Communities"}
          </button>
        ))}
      </div>
      {tab === "messages" ? <DirectMessagesTab /> : <CommunitiesTab canCreate={canCreateCommunity} />}
    </div>
  );
}
