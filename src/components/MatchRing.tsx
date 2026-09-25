export function MatchRing({ score, size = 160 }: { score: number; size?: number }) {
  const deg = (Math.max(0, Math.min(100, score)) / 100) * 360;

  return (
    <div
      className="relative flex flex-none items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#6C63FF 0deg, #A66CFF ${deg}deg, #1D2330 ${deg}deg)`,
        boxShadow: "0 0 60px rgba(108,99,255,0.35)",
      }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full"
        style={{
          width: size - 16,
          height: size - 16,
          background: "var(--color-bg)",
        }}
      >
        <span className="gradient-text text-3xl font-bold tracking-tight">
          {score}%
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-muted)" }}
        >
          Match
        </span>
      </div>
    </div>
  );
}
