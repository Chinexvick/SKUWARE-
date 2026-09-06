type MascotPose = "wave" | "empty" | "celebrate" | "sleep" | "error";

const POSE_LABEL: Record<MascotPose, string> = {
  wave: "Skuware mascot waving",
  empty: "Skuware mascot looking through a magnifying glass",
  celebrate: "Skuware mascot celebrating",
  sleep: "Skuware mascot resting",
  error: "Skuware mascot looking puzzled",
};

/**
 * A small brand character (yellow/black, matching the logo) used in empty
 * states, success moments, and error pages instead of bare text — the
 * "give the platform personality" ask. Pure inline SVG so it never depends
 * on an external asset host, with a CSS-only float/bounce for a touch of
 * life without pulling in an animation library.
 */
export function Mascot({ pose = "wave", size = 120, className = "" }: { pose?: MascotPose; size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label={POSE_LABEL[pose]}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${pose === "sleep" ? "" : "animate-mascot-float"} ${className}`}
    >
      {/* Shadow */}
      <ellipse cx="100" cy="176" rx="46" ry="8" fill="#000" opacity="0.08" />

      {/* Body */}
      <circle cx="100" cy="100" r="62" fill="#FAEE1E" stroke="#000" strokeWidth="4" />

      {/* Face */}
      {pose === "error" ? (
        <>
          <circle cx="80" cy="94" r="6" fill="#000" />
          <circle cx="120" cy="94" r="6" fill="#000" />
          <path d="M82 126q18 -12 36 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : pose === "sleep" ? (
        <>
          <path d="M72 94q8 -6 16 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M112 94q8 -6 16 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M88 118q12 8 24 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
          <text x="132" y="60" fontSize="20" fontWeight="700" fill="#000">
            z
          </text>
          <text x="146" y="42" fontSize="15" fontWeight="700" fill="#000">
            z
          </text>
        </>
      ) : (
        <>
          <circle cx="80" cy="96" r="7" fill="#000" />
          <circle cx="120" cy="96" r="7" fill="#000" />
          <path
            d={pose === "celebrate" ? "M78 120q22 18 44 0" : "M82 118q18 14 36 0"}
            stroke="#000"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {pose === "wave" && (
        <g className="animate-mascot-wave" style={{ transformOrigin: "150px 90px" }}>
          <circle cx="152" cy="70" r="14" fill="#FAEE1E" stroke="#000" strokeWidth="4" />
        </g>
      )}

      {pose === "empty" && (
        <g transform="translate(126,118) rotate(20)">
          <circle cx="0" cy="0" r="16" fill="none" stroke="#000" strokeWidth="5" />
          <line x1="11" y1="11" x2="26" y2="26" stroke="#000" strokeWidth="5" strokeLinecap="round" />
        </g>
      )}

      {pose === "celebrate" && (
        <>
          <circle cx="34" cy="46" r="4" fill="#000" opacity="0.7" />
          <circle cx="166" cy="52" r="5" fill="#000" opacity="0.5" />
          <circle cx="26" cy="100" r="3" fill="#000" opacity="0.6" />
          <circle cx="172" cy="120" r="4" fill="#000" opacity="0.6" />
          <circle cx="150" cy="30" r="3" fill="#000" opacity="0.5" />
        </>
      )}
    </svg>
  );
}
