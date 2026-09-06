export const BRAND_EMOJIS = ["thumbsup", "clap", "heart", "star", "fire", "laugh"] as const;
export type BrandEmojiCode = (typeof BRAND_EMOJIS)[number];

const LABEL: Record<BrandEmojiCode, string> = {
  thumbsup: "Thumbs up",
  clap: "Clap",
  heart: "Heart",
  star: "Star",
  fire: "Fire",
  laugh: "Laugh",
};

/** Small brand-colored animated "stickers" — the platform's own emoji set, referenced in text as :code:. */
export function BrandEmoji({ code, size = 22, className = "" }: { code: BrandEmojiCode; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24" };

  switch (code) {
    case "thumbsup":
      return (
        <svg {...common} className={`inline-block animate-emoji-bounce align-middle ${className}`} aria-label={LABEL[code]}>
          <path d="M7 11h2v9H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" fill="#000" />
          <path
            d="M10 11l3.5-7a2 2 0 0 1 3.7 1.3L16.5 9H19a2 2 0 0 1 2 2.3l-1.2 6A3 3 0 0 1 16.8 20H10V11Z"
            fill="#FAEE1E"
            stroke="#000"
            strokeWidth="1.3"
          />
        </svg>
      );
    case "clap":
      return (
        <svg {...common} className={`inline-block animate-emoji-pulse align-middle ${className}`} aria-label={LABEL[code]}>
          <circle cx="8" cy="10" r="5" fill="#FAEE1E" stroke="#000" strokeWidth="1.3" />
          <circle cx="16" cy="10" r="5" fill="#FAEE1E" stroke="#000" strokeWidth="1.3" />
          <path d="M4 18c2-2 14-2 16 0" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} className={`inline-block animate-emoji-heartbeat align-middle ${className}`} aria-label={LABEL[code]}>
          <path
            d="M12 20.5s-8-5-8-11.2A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8 2.9c0 6.2-8 11.2-8 11.2Z"
            fill="#000"
          />
          <path
            d="M12 19s-6.7-4.2-6.7-9.4A4 4 0 0 1 12 7a4 4 0 0 1 6.7 2.6C18.7 14.8 12 19 12 19Z"
            fill="#FAEE1E"
          />
        </svg>
      );
    case "star":
      return (
        <svg {...common} className={`inline-block animate-emoji-spin-slow align-middle ${className}`} aria-label={LABEL[code]}>
          <path
            d="M12 2.5l2.7 6.3 6.8.6-5.2 4.5 1.6 6.6L12 17l-5.9 3.5 1.6-6.6L2.5 9.4l6.8-.6L12 2.5Z"
            fill="#FAEE1E"
            stroke="#000"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "fire":
      return (
        <svg {...common} className={`inline-block animate-emoji-flicker align-middle ${className}`} aria-label={LABEL[code]}>
          <path
            d="M12 2s4 3.5 4 8a4 4 0 0 1-1.5 3.1A3 3 0 0 0 12 9s-1 2-1 3.5A3 3 0 0 0 9.5 13 4 4 0 0 0 8 16a4 4 0 0 0 8 0c0-1-.3-1.8-.8-2.5C17 12 18 10 18 8c0-3-2-5-2-5s.5 2-1 3c0-2-1.5-4-3-4Z"
            fill="#000"
          />
          <path
            d="M12 6s2.5 2.3 2.5 5.2A2.5 2.5 0 0 1 12 13.7a2.5 2.5 0 0 1-2.5-2.5c0-1 .6-1.6 1-2.2-.1 1 .3 1.4.7 1.4.8 0 .8-1.4.8-2.4Z"
            fill="#FAEE1E"
          />
        </svg>
      );
    case "laugh":
      return (
        <svg {...common} className={`inline-block animate-emoji-bounce align-middle ${className}`} aria-label={LABEL[code]}>
          <circle cx="12" cy="12" r="9.5" fill="#FAEE1E" stroke="#000" strokeWidth="1.3" />
          <path d="M8 10.5c.5-1 1.2-1 1.7 0M14.3 10.5c.5-1 1.2-1 1.7 0" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6.5 13.5c1 3 3 4.5 5.5 4.5s4.5-1.5 5.5-4.5Z" fill="#000" />
        </svg>
      );
  }
}
