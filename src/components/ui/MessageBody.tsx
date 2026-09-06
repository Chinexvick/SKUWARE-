import { Fragment } from "react";
import { BRAND_EMOJIS, BrandEmoji, type BrandEmojiCode } from "./BrandEmoji";

const EMOJI_TOKEN = new RegExp(`:(${BRAND_EMOJIS.join("|")}):`, "g");

/** Renders message text, swapping recognized :code: tokens for animated brand emoji. */
export function MessageBody({ text }: { text: string }) {
  const parts = text.split(EMOJI_TOKEN);
  return (
    <>
      {parts.map((part, i) =>
        (BRAND_EMOJIS as readonly string[]).includes(part) ? (
          <BrandEmoji key={i} code={part as BrandEmojiCode} />
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
