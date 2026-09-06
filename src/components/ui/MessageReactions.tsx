"use client";

import { EmojiTray, AnimatedEmoji } from "./EmojiTray";

export interface ReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export function MessageReactions({ reactions, onToggle }: { reactions: ReactionSummary[]; onToggle: (emoji: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition ${
            r.reactedByMe ? "border-brand-yellow bg-brand-yellow/20" : "border-gray-200 bg-white hover:bg-brand-light"
          }`}
        >
          <AnimatedEmoji char={r.emoji.startsWith(":") ? "🙂" : r.emoji} size={13} />
          <span className="font-semibold text-black">{r.count}</span>
        </button>
      ))}
      <EmojiTray
        compact
        onPick={onToggle}
        trigger={
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M8 10.5c.4-.8 1-.8 1.4 0M14.6 10.5c.4-.8 1-.8 1.4 0" strokeLinecap="round" />
            <path d="M8 14.5c1 1.7 6 1.7 8 0" strokeLinecap="round" />
          </svg>
        }
      />
    </div>
  );
}
