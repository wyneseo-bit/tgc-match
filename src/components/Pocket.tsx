/** Each collector's Pocket avatar wears a sleeve in one of these colours. */
export type Sleeve = "pear" | "seal" | "blush" | "paper";

/**
 * Pocket, the Trade Matcher mascot.
 *
 * An original character: a trading card with a face in its art box, wearing a
 * sleeve cap with a toploader thumb-notch. The notch is the silhouette people
 * remember, so it survives down to favicon size.
 */

export type Expression =
  | "curious"
  | "excited"
  | "thinking"
  | "celebrating"
  | "concerned"
  | "sleeping"
  | "searching";

export type Prop = "none" | "card" | "binder" | "two-cards" | "empty-binder";

const SLEEVE: Record<Sleeve, string> = {
  pear: "var(--color-pear)",
  seal: "var(--color-seal)",
  blush: "var(--color-blush)",
  paper: "var(--color-fg-2)",
};

const INK = "#0c0f15";
const PAPER = "#f1f2ee";
const LIMB = "#d9dce3";

type ArmPose = "down" | "up" | "chin" | "right-up" | "hold" | "magnifier";

const POSE: Record<Expression, ArmPose> = {
  curious: "right-up",
  excited: "up",
  thinking: "chin",
  celebrating: "up",
  concerned: "hold",
  sleeping: "down",
  searching: "magnifier",
};

const ARMS: Record<ArmPose, { l: string; r: string; lh: [number, number]; rh: [number, number] }> = {
  down: { l: "M27 88 C19 94 17 101 19 108", r: "M93 88 C101 94 103 101 101 108", lh: [19, 108], rh: [101, 108] },
  up: { l: "M27 86 C17 80 13 70 15 59", r: "M93 86 C103 80 107 70 105 59", lh: [15, 59], rh: [105, 59] },
  "right-up": { l: "M27 88 C19 94 17 101 19 108", r: "M93 86 C103 80 107 70 105 59", lh: [19, 108], rh: [105, 59] },
  chin: { l: "M27 88 C19 94 17 101 19 108", r: "M93 92 C102 90 101 84 91 82", lh: [19, 108], rh: [91, 82] },
  hold: { l: "M27 88 C20 92 22 100 30 102", r: "M93 88 C100 92 98 100 90 102", lh: [30, 102], rh: [90, 102] },
  magnifier: { l: "M27 88 C19 94 17 101 19 108", r: "M93 88 C101 90 99 84 92 82", lh: [19, 108], rh: [92, 82] },
};

function Eyes({ expression }: { expression: Expression }) {
  const L = 49;
  const R = 71;
  const Y = 67;

  if (expression === "celebrating") {
    return (
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d={`M${L - 4.5} ${Y + 1} q4.5 -6 9 0`} />
        <path d={`M${R - 4.5} ${Y + 1} q4.5 -6 9 0`} />
      </g>
    );
  }
  if (expression === "sleeping") {
    return (
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d={`M${L - 4.5} ${Y} q4.5 4.5 9 0`} />
        <path d={`M${R - 4.5} ${Y} q4.5 4.5 9 0`} />
      </g>
    );
  }

  const look: Record<Expression, [number, number]> = {
    curious: [1.6, 0],
    excited: [0, 0],
    thinking: [-1.4, -2],
    celebrating: [0, 0],
    concerned: [0, 0.6],
    sleeping: [0, 0],
    searching: [1, 0],
  };
  const [dx, dy] = look[expression];
  const ry = expression === "excited" ? 7 : 6;

  return (
    <g className="origin-center animate-blink [transform-box:fill-box]">
      {[L, R].map((x) => {
        const big = expression === "searching" && x === R;
        return (
          <g key={x}>
            <ellipse cx={x + dx} cy={Y + dy} rx={big ? 5.6 : 4.6} ry={big ? 7.6 : ry} fill={INK} />
            <circle cx={x + dx + 1.6} cy={Y + dy - 2.4} r={big ? 2 : 1.6} fill={PAPER} />
            {expression === "excited" && <circle cx={x + dx - 1.4} cy={Y + dy + 2.4} r={0.9} fill={PAPER} />}
          </g>
        );
      })}
      {expression === "concerned" && (
        <g stroke={INK} strokeWidth={2.4} strokeLinecap="round">
          <path d={`M${L - 5} ${Y - 11} L${L + 3} ${Y - 9}`} />
          <path d={`M${R + 5} ${Y - 11} L${R - 3} ${Y - 9}`} />
        </g>
      )}
    </g>
  );
}

function Mouth({ expression }: { expression: Expression }) {
  switch (expression) {
    case "excited":
    case "celebrating":
      return <path d="M53 76 q7 10 14 0 z" fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />;
    case "curious":
    case "sleeping":
      return <ellipse cx={60} cy={79} rx={2.2} ry={2.6} fill={INK} />;
    case "thinking":
      return <path d="M55 79 L65 77.5" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />;
    case "concerned":
      return <path d="M53 80 q3.5 -3 7 0 q3.5 3 7 0" stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" />;
    case "searching":
      return <path d="M56 77 q4 3.4 8 0" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
  }
}

function MiniCard({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`rotate(${rotate} ${x + 9} ${y + 12.5})`}>
      <rect x={x} y={y} width={18} height={25} rx={2.6} fill="var(--color-page-3)" stroke={INK} strokeWidth={2.2} />
      <rect x={x + 2.5} y={y + 2.5} width={13} height={20} rx={1.6} fill="none" stroke="var(--color-pear)" strokeWidth={1.4} />
      <path d={`M${x + 9} ${y + 8} l3.4 4.5 -3.4 4.5 -3.4 -4.5 z`} fill="var(--color-pear)" />
    </g>
  );
}

export function Pocket({
  expression = "curious",
  prop = "none",
  sleeve = "pear",
  size = 120,
  crop = "full",
  animate = true,
  className,
  title,
}: {
  expression?: Expression;
  prop?: Prop;
  sleeve?: Sleeve;
  size?: number;
  /** "face" crops to the cap and face, for logos and avatars. */
  crop?: "full" | "face";
  /** Idle sway. Blink always runs (and is disabled by reduced motion). */
  animate?: boolean;
  className?: string;
  title?: string;
}) {
  const pose = prop === "empty-binder" ? ARMS.hold : ARMS[POSE[expression]];
  const face = crop === "face";
  const viewBox = face ? "16 10 88 88" : "0 0 120 140";
  const height = face ? size : Math.round(size * (140 / 120));
  const tilt = expression === "curious" ? -5 : expression === "thinking" ? 4 : 0;

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g
        className={animate && !face ? "origin-bottom animate-sway [transform-box:fill-box]" : undefined}
      >
        <g transform={`rotate(${tilt} 60 120)`}>
          {/* Legs */}
          {!face && (
            <g strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M48 120 v9 h-5 M72 120 v9 h5" stroke={INK} strokeWidth={8} />
              <path d="M48 120 v9 h-5 M72 120 v9 h5" stroke={LIMB} strokeWidth={3.6} />
            </g>
          )}

          {/* Card body */}
          <rect x={26} y={28} width={68} height={94} rx={12} fill={PAPER} stroke={INK} strokeWidth={3} />
          {/* Art box, where the face lives */}
          <rect x={33} y={46} width={54} height={44} rx={7} fill="#e3e5df" />
          {/* Card text lines + rarity mark */}
          {!face && (
            <g>
              <path d="M37 99 h34" stroke="#c9ccd4" strokeWidth={3} strokeLinecap="round" />
              <path d="M37 106 h22" stroke="#c9ccd4" strokeWidth={3} strokeLinecap="round" />
              <path d="M81 108 l3 3.5 -3 3.5 -3 -3.5 z" fill={INK} />
            </g>
          )}

          {/* Sleeve cap with the thumb-notch */}
          <path
            d="M22 50 V32 Q22 18 36 18 H50 A10 10 0 0 0 70 18 H84 Q98 18 98 32 V50 Q60 44 22 50 Z"
            fill={SLEEVE[sleeve]}
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path d="M30 30 Q30 25 36 25" stroke="rgb(255 255 255 / 0.55)" strokeWidth={2.4} strokeLinecap="round" fill="none" />

          {/* Cheeks */}
          <ellipse cx={41} cy={78} rx={4} ry={2.4} fill="var(--color-blush)" opacity={0.75} />
          <ellipse cx={79} cy={78} rx={4} ry={2.4} fill="var(--color-blush)" opacity={0.75} />

          <Eyes expression={expression} />
          <Mouth expression={expression} />

          {/* Arms */}
          {!face && (
            <g>
              {/* Limbs are light with an ink outline so they read on dark UI */}
              <g strokeLinecap="round" fill="none">
                <path d={pose.l} stroke={INK} strokeWidth={7.5} />
                <path d={pose.r} stroke={INK} strokeWidth={7.5} />
                <path d={pose.l} stroke={LIMB} strokeWidth={3.4} />
                <path d={pose.r} stroke={LIMB} strokeWidth={3.4} />
              </g>

              {/* Props held in hands */}
              {prop === "binder" && (
                <g>
                  <rect x={4} y={92} width={24} height={30} rx={3.5} fill="var(--color-page-3)" stroke={INK} strokeWidth={2.5} />
                  <rect x={8} y={97} width={16} height={20} rx={2} fill="none" stroke="var(--color-pear)" strokeWidth={1.4} strokeDasharray="3 2" />
                  <circle cx={7.5} cy={100} r={1.3} fill={PAPER} />
                  <circle cx={7.5} cy={114} r={1.3} fill={PAPER} />
                </g>
              )}
              {prop === "empty-binder" && (
                <g>
                  <rect x={30} y={96} width={60} height={30} rx={4} fill="var(--color-page-3)" stroke={INK} strokeWidth={2.5} />
                  <path d="M60 96 v30" stroke={INK} strokeWidth={2} />
                  {[36, 47, 65, 76].map((x) => (
                    <rect key={x} x={x} y={101} width={8} height={9} rx={1.5} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth={1} strokeDasharray="2 1.5" />
                  ))}
                  {[36, 47, 65, 76].map((x) => (
                    <rect key={`b${x}`} x={x} y={113} width={8} height={9} rx={1.5} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth={1} strokeDasharray="2 1.5" />
                  ))}
                </g>
              )}
              {prop === "card" && <MiniCard x={97} y={34} rotate={12} />}
              {prop === "two-cards" && (
                <>
                  <MiniCard x={3} y={34} rotate={-12} />
                  <MiniCard x={99} y={34} rotate={12} />
                </>
              )}

              {expression === "searching" && (
                <g className="animate-scan">
                  <path d="M88 84 L98 98" stroke={INK} strokeWidth={8} strokeLinecap="round" />
                  <path d="M88 84 L98 98" stroke="var(--color-seal)" strokeWidth={3.6} strokeLinecap="round" />
                  <circle cx={73} cy={67} r={11.5} fill="rgb(108 182 255 / 0.18)" stroke={INK} strokeWidth={3.2} />
                  <path d="M66 62 q3 -4 8 -4" stroke="rgb(255 255 255 / 0.7)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </g>
              )}

              <circle cx={pose.lh[0]} cy={pose.lh[1]} r={4.4} fill={PAPER} stroke={INK} strokeWidth={2.6} />
              <circle cx={pose.rh[0]} cy={pose.rh[1]} r={4.4} fill={PAPER} stroke={INK} strokeWidth={2.6} />
            </g>
          )}

          {/* Expression extras */}
          {expression === "thinking" && !face && (
            <g fill="var(--color-fg-2)">
              <circle cx={98} cy={30} r={2.2} />
              <circle cx={105} cy={22} r={2.8} />
              <circle cx={113} cy={12} r={3.4} />
            </g>
          )}
          {expression === "concerned" && (
            <path d="M88 38 q-4 6 0 9 q4 -3 0 -9 z" fill="var(--color-seal)" stroke={INK} strokeWidth={1.4} />
          )}
          {expression === "sleeping" && !face && (
            <g fill="var(--color-fg-2)" fontFamily="var(--font-display)" fontWeight={700}>
              <text x={98} y={22} fontSize={12} className="animate-float-z">z</text>
              <text x={107} y={11} fontSize={9} className="animate-float-z [animation-delay:1.3s]">z</text>
            </g>
          )}
          {expression === "celebrating" && !face && (
            <g stroke="var(--color-pear)" strokeWidth={2.4} strokeLinecap="round">
              <path d="M60 4 v6" />
              <path d="M44 9 l3 4" />
              <path d="M76 9 l-3 4" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
