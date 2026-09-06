/**
 * A basic, always-on word filter for community/direct messages — blocks the
 * message and tells the sender exactly which word tripped it. This is a
 * blunt keyword list, not real content-moderation AI; it exists as a safety
 * floor (especially since students and parents share these communities),
 * not a claim of catching everything.
 */
const BLOCKED_WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "rape",
  "porn",
  "sex",
  "sexy",
  "penis",
  "vagina",
  "boobs",
  "nude",
  "naked",
];

const BLOCKED_PATTERN = new RegExp(`\\b(${BLOCKED_WORDS.join("|")})\\b`, "i");

export interface ModerationResult {
  blocked: boolean;
  flaggedWord?: string;
}

export function checkMessage(text: string): ModerationResult {
  const match = text.match(BLOCKED_PATTERN);
  if (!match) return { blocked: false };
  return { blocked: true, flaggedWord: match[0] };
}
