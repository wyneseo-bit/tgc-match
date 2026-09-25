import Link from "next/link";
import { ArrowLeftRight, BadgeCheck, ChevronRight } from "lucide-react";
import { TcgCard } from "./TcgCard";

export type MatchCardSide = {
  name: string;
  setName: string;
  cardNumber: string;
  imageUrl: string | null;
};

export function MatchCard({
  id,
  score,
  isNew,
  youGive,
  youGet,
  counterpartName,
  counterpartVerified,
  counterpartLocation,
  featured,
  action,
}: {
  id: string;
  score: number;
  isNew: boolean;
  youGive: MatchCardSide[];
  youGet: MatchCardSide[];
  counterpartName: string;
  counterpartVerified: boolean;
  counterpartLocation: string | null;
  featured: boolean;
  action: React.ReactNode;
}) {
  const initial = counterpartName.charAt(0).toUpperCase();
  const give = youGive[0];
  const get = youGet[0];

  return (
    <div
      className="glass flex flex-col gap-4 rounded-card p-5"
      style={{
        border: featured
          ? "1px solid rgba(108,99,255,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: featured ? "var(--shadow-featured)" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="gradient-text text-lg font-bold tracking-tight">
          {score}% MATCH
        </span>
        <div className="flex items-center gap-1.5">
          {isNew && (
            <span
              className="rounded-pill px-2 py-1 text-[10px] font-semibold tracking-wide"
              style={{ color: "var(--color-cyan)", background: "var(--color-cyan-tint)" }}
            >
              NEW
            </span>
          )}
          <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
            Pokémon
          </span>
          <Link
            href={`/matches/${id}`}
            className="flex items-center rounded-full"
            style={{ color: "var(--color-muted)" }}
            aria-label="View match details"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between px-1.5">
        {give && (
          <TcgCard width={100} imageUrl={give.imageUrl} alt={give.name} name={give.name} />
        )}
        <div
          className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-border-strong"
          style={{ background: "var(--color-surface-2)" }}
        >
          <ArrowLeftRight size={15} strokeWidth={2} color="var(--color-text-2-body)" />
        </div>
        {get && (
          <TcgCard width={100} imageUrl={get.imageUrl} alt={get.name} name={get.name} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            You give
          </span>
          <span className="truncate text-[13px] font-semibold">
            {give?.name ?? "—"}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 text-right">
          <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
            You get
          </span>
          <span className="truncate text-[13px] font-semibold">
            {get?.name ?? "—"}
          </span>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#6C63FF,#42D9E8)" }}
        >
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold">
            {counterpartName}
            {counterpartVerified && (
              <BadgeCheck size={13} strokeWidth={2} color="var(--color-cyan)" />
            )}
          </span>
          {counterpartLocation && (
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              {counterpartLocation}
            </span>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
