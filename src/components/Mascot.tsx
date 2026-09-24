export type MascotMood =
  | "curious"
  | "excited"
  | "thinking"
  | "searching"
  | "celebrating"
  | "concerned"
  | "sleeping";

export type MascotColor = "indigo" | "violet" | "cyan" | "coral";

const COLORS: Record<MascotColor, string> = {
  indigo: "#6C63FF",
  violet: "#A66CFF",
  cyan: "#2FBFCE",
  coral: "#F07565",
};

type MoodDef = {
  eyes: "open" | "happy" | "closed";
  big?: boolean;
  p?: [number, number];
  mouth: string;
  fill: string;
  armL: string;
  armR: string;
  sparkle?: boolean;
  zz?: boolean;
  magnifier?: boolean;
  drop?: boolean;
  brows?: boolean;
  heldCard?: boolean;
};

const MOODS: Record<MascotMood, MoodDef> = {
  curious: {
    eyes: "open",
    p: [1.6, -1.6],
    mouth: "M58 55 a2.6 2.6 0 1 0 0.1 0",
    fill: "#0B0D12",
    armL: "M31 66 q-10 8 -6 20",
    armR: "M89 60 q13 -6 12 -22",
  },
  excited: {
    eyes: "open",
    big: true,
    p: [0, 0],
    mouth: "M53 52 q7 9 14 0 z",
    fill: "#0B0D12",
    armL: "M31 60 q-13 -8 -10 -22",
    armR: "M89 60 q13 -8 10 -22",
    sparkle: true,
  },
  thinking: {
    eyes: "open",
    p: [-1.8, -2.2],
    mouth: "M56 55 h8",
    fill: "none",
    armL: "M31 66 q-10 8 -6 20",
    armR: "M89 72 q6 -12 -14 -14",
  },
  searching: {
    eyes: "open",
    p: [2.2, 0.5],
    mouth: "M55 54 q5 3 10 0",
    fill: "none",
    armL: "M31 66 q-10 8 -6 20",
    armR: "M89 66 q8 -2 10 -6",
    magnifier: true,
  },
  celebrating: {
    eyes: "happy",
    mouth: "M53 51 q7 10 14 0 z",
    fill: "#0B0D12",
    armL: "M31 60 q-12 -6 -16 -18",
    armR: "M89 60 q12 -6 16 -18",
    sparkle: true,
    heldCard: true,
  },
  concerned: {
    eyes: "open",
    p: [0, 1.2],
    brows: true,
    mouth: "M54 56 q3 -3 6 0 q3 3 6 0",
    fill: "none",
    armL: "M31 66 q-8 -2 -6 -14",
    armR: "M89 66 q8 -2 6 -14",
    drop: true,
  },
  sleeping: {
    eyes: "closed",
    mouth: "M57 55 q3 2 6 0",
    fill: "none",
    armL: "M31 68 q-9 8 -4 18",
    armR: "M89 68 q9 8 4 18",
    zz: true,
  },
};

export function Mascot({
  mood = "curious",
  size = 120,
  color = "indigo",
  className,
}: {
  mood?: MascotMood;
  size?: number;
  color?: MascotColor;
  className?: string;
}) {
  const m = MOODS[mood];
  const c = COLORS[color];
  const p = m.p ?? [0, 0];
  const h = (size * 130) / 120;

  const er = m.big ? 7 : 6;
  const ery = m.big ? 8.5 : 7;
  const p1x = 51 + p[0];
  const p2x = 69 + p[0];
  const py = 41 + p[1];
  const g1x = 52.2 + p[0];
  const g2x = 70.2 + p[0];
  const gy = 39.6 + p[1];

  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={h}
      style={{ display: "block", overflow: "visible", flex: "none" }}
      className={className}
    >
      <ellipse cx={60} cy={122} rx={30} ry={4} fill="rgba(0,0,0,0.45)" />

      {m.sparkle && (
        <>
          <path d="M14 14 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#FFD866" />
          <path
            d="M104 8 l1.5 4.5 4.5 1.5 -4.5 1.5 -1.5 4.5 -1.5 -4.5 -4.5 -1.5 4.5 -1.5z"
            fill="#FFD866"
          />
          <circle cx={110} cy={34} r={2} fill="#FF8A7A" />
        </>
      )}

      {m.zz && (
        <>
          <text x={92} y={18} fill="#A66CFF" style={{ font: "700 14px Geist, sans-serif" }}>
            z
          </text>
          <text
            x={103}
            y={7}
            fill="#A66CFF"
            style={{ font: "700 10px Geist, sans-serif", opacity: 0.7 }}
          >
            z
          </text>
        </>
      )}

      <rect x={42} y={100} width={12} height={11} rx={5} fill={c} />
      <rect x={66} y={100} width={12} height={11} rx={5} fill={c} />

      <g transform="rotate(-3 60 60)">
        <rect
          x={30}
          y={16}
          width={60}
          height={88}
          rx={12}
          fill="#F4F2FF"
          stroke={c}
          style={{ strokeWidth: 3 }}
        />
        <path d="M76 16 H78 Q90 16 90 28 V30 Z" fill="#FF8A7A" />
        <rect x={37} y={23} width={46} height={40} rx={7} fill={c} />
        <circle cx={43} cy={54} r={3} fill="#FF8A7A" opacity={0.9} />
        <circle cx={77} cy={54} r={3} fill="#FF8A7A" opacity={0.9} />

        {m.eyes === "open" && (
          <>
            <ellipse cx={51} cy={41} rx={er} ry={ery} fill="#fff" />
            <ellipse cx={69} cy={41} rx={er} ry={ery} fill="#fff" />
            <circle cx={p1x} cy={py} r={3.2} fill="#0B0D12" />
            <circle cx={p2x} cy={py} r={3.2} fill="#0B0D12" />
            <circle cx={g1x} cy={gy} r={1.1} fill="#fff" />
            <circle cx={g2x} cy={gy} r={1.1} fill="#fff" />
          </>
        )}

        {m.eyes === "happy" && (
          <path
            d="M45 43 q6 -8 12 0 M63 43 q6 -8 12 0"
            fill="none"
            stroke="#fff"
            style={{ strokeWidth: 3, strokeLinecap: "round" }}
          />
        )}

        {m.eyes === "closed" && (
          <path
            d="M45 41 q6 5 12 0 M63 41 q6 5 12 0"
            fill="none"
            stroke="#fff"
            style={{ strokeWidth: 2.6, strokeLinecap: "round" }}
          />
        )}

        {m.brows && (
          <path
            d="M45 31 l10 3 M75 31 l-10 3"
            fill="none"
            stroke="#fff"
            style={{ strokeWidth: 2.4, strokeLinecap: "round" }}
          />
        )}

        <path
          d={m.mouth}
          fill={m.fill}
          stroke="#fff"
          style={{ strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }}
        />

        <rect x={38} y={71} width={44} height={4} rx={2} fill={c} opacity={0.28} />
        <rect x={38} y={80} width={30} height={4} rx={2} fill={c} opacity={0.28} />
        <rect x={38} y={89} width={36} height={4} rx={2} fill={c} opacity={0.18} />
      </g>

      <path d={m.armL} fill="none" stroke={c} style={{ strokeWidth: 5, strokeLinecap: "round" }} />
      <path d={m.armR} fill="none" stroke={c} style={{ strokeWidth: 5, strokeLinecap: "round" }} />

      {m.magnifier && (
        <>
          <line
            x1={102}
            y1={62}
            x2={110}
            y2={74}
            stroke={c}
            style={{ strokeWidth: 5, strokeLinecap: "round" }}
          />
          <circle
            cx={98}
            cy={52}
            r={11}
            fill="rgba(66,217,232,0.22)"
            stroke="#42D9E8"
            style={{ strokeWidth: 3.5 }}
          />
          <path
            d="M92 48 q3 -4 8 -3"
            fill="none"
            stroke="#fff"
            style={{ strokeWidth: 2, strokeLinecap: "round", opacity: 0.8 }}
          />
        </>
      )}

      {m.drop && (
        <path d="M94 22 q5 7 0 11 q-5 -4 0 -11z" fill="#42D9E8" />
      )}

      {m.heldCard && (
        <>
          <g transform="rotate(12 104 30)">
            <rect x={94} y={14} width={22} height={30} rx={3} fill="#FFD866" stroke="#0B0D12" style={{ strokeWidth: 1.5 }} />
            <rect x={98} y={18} width={14} height={12} rx={2} fill="#FF8A7A" />
          </g>
          <g transform="rotate(-12 16 30)">
            <rect x={4} y={14} width={22} height={30} rx={3} fill="#42D9E8" stroke="#0B0D12" style={{ strokeWidth: 1.5 }} />
            <rect x={8} y={18} width={14} height={12} rx={2} fill="#6C63FF" />
          </g>
        </>
      )}
    </svg>
  );
}
