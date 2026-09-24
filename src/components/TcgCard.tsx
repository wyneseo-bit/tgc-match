export type TcgCardTone = "indigo" | "violet" | "cyan" | "coral" | "yellow" | "slate";

const TONES: Record<TcgCardTone, [string, string]> = {
  indigo: ["#2A2668", "linear-gradient(150deg,#8F88FF,#3B33B8)"],
  violet: ["#3A2263", "linear-gradient(150deg,#C79BFF,#6A2FC4)"],
  cyan: ["#123F48", "linear-gradient(150deg,#8AF0F8,#1A8C99)"],
  coral: ["#5A2420", "linear-gradient(150deg,#FFC0A8,#E0503F)"],
  yellow: ["#5C4614", "linear-gradient(150deg,#FFEBA6,#D9A11E)"],
  slate: ["#252B38", "linear-gradient(150deg,#B7BFD3,#4A5367)"],
};

export function TcgCard({
  width = 140,
  imageUrl,
  alt,
  name,
  code,
  tone = "indigo",
}: {
  width?: number;
  imageUrl?: string | null;
  alt: string;
  name?: string;
  code?: string;
  tone?: TcgCardTone;
}) {
  const radius = Math.max(4, width * 0.05);

  if (imageUrl) {
    return (
      <div
        style={{
          width,
          aspectRatio: "63 / 88",
          borderRadius: radius,
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)",
          flex: "none",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  const [frame, art] = TONES[tone];
  const pad = Math.max(3, width * 0.045);
  const innerRadius = Math.max(2, width * 0.03);
  const fontSize = Math.max(6, width / 13);

  return (
    <div
      style={{
        width,
        aspectRatio: "63 / 88",
        borderRadius: radius,
        padding: pad,
        boxSizing: "border-box",
        background: frame,
        display: "flex",
        flexDirection: "column",
        gap: pad,
        fontSize,
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)",
        flex: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 4,
          color: "#fff",
          fontWeight: 600,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {name ?? alt}
        </span>
        {code && <span style={{ opacity: 0.7, fontWeight: 500 }}>{code}</span>}
      </div>
      <div
        style={{
          flex: "1 1 55%",
          borderRadius: innerRadius,
          background: art,
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "70%",
            aspectRatio: "1",
            borderRadius: "50%",
            left: "15%",
            top: "18%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "34%",
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
          }}
        />
      </div>
      <div
        style={{
          flex: "0 0 26%",
          borderRadius: innerRadius,
          background: "rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.45em",
          padding: "0 0.7em",
        }}
      >
        <div style={{ height: "0.35em", width: "85%", borderRadius: 99, background: "rgba(255,255,255,0.35)" }} />
        <div style={{ height: "0.35em", width: "60%", borderRadius: 99, background: "rgba(255,255,255,0.22)" }} />
        <div style={{ height: "0.35em", width: "72%", borderRadius: 99, background: "rgba(255,255,255,0.22)" }} />
      </div>
    </div>
  );
}
