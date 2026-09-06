"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_EMOJIS, BrandEmoji } from "./BrandEmoji";

export function EmojiPicker({ onPick }: { onPick: (code: string) => void }) {
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
        aria-label="Insert emoji"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-lg hover:bg-brand-light"
      >
        <BrandEmoji code="star" size={20} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-2 flex gap-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
          {BRAND_EMOJIS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                onPick(code);
                setOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-light"
            >
              <BrandEmoji code={code} size={22} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
