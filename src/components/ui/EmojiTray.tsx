"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_EMOJIS, BrandEmoji } from "./BrandEmoji";

/** The requested reaction/sticker set — real emoji glyphs, each given a touch of brand-style motion via CSS. */
export const REACTION_EMOJIS = [
  "❤️", "🔥", "🥲", "🙏", "🤣", "😩", "😇", "🎂", "❤️‍🔥", "🤔",
  "🫡", "😊", "👏", "✋", "👋", "🤲", "🤙", "🫴", "🙌", "👌",
  "👐", "💥", "👊", "🫳", "💃",
] as const;

const MOTION_CLASSES = ["animate-emoji-bounce", "animate-emoji-pulse", "animate-emoji-heartbeat", "animate-emoji-flicker"];

function motionFor(char: string): string {
  let hash = 0;
  for (let i = 0; i < char.length; i++) hash = (hash * 31 + char.charCodeAt(i)) >>> 0;
  return MOTION_CLASSES[hash % MOTION_CLASSES.length];
}

export function AnimatedEmoji({ char, size = 20 }: { char: string; size?: number }) {
  return (
    <span className={`inline-block ${motionFor(char)}`} style={{ fontSize: size, lineHeight: 1 }}>
      {char}
    </span>
  );
}

/**
 * A single tray combining the 6 custom brand "stickers" (animated inline
 * SVG, inserted as :code: text tokens) with the full requested emoji set
 * (real glyphs, each animated). Used both for composing — where a tap sends
 * immediately — and for reacting to a message.
 */
export function EmojiTray({
  onPick,
  trigger,
  compact = false,
}: {
  onPick: (token: string) => void;
  trigger?: React.ReactNode;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Emoji"
        className={
          compact
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-brand-light"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 hover:bg-brand-light"
        }
      >
        {trigger ?? <AnimatedEmoji char="😊" size={20} />}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl">
          <div className="mb-2 grid grid-cols-6 gap-1 border-b border-gray-100 pb-2">
            {BRAND_EMOJIS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  onPick(`:${code}:`);
                  setOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-light"
              >
                <BrandEmoji code={code} size={20} />
              </button>
            ))}
          </div>
          <div className="grid max-h-40 grid-cols-6 gap-1 overflow-y-auto">
            {REACTION_EMOJIS.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => {
                  onPick(char);
                  setOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-light"
              >
                <AnimatedEmoji char={char} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
