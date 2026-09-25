import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { MatchRing } from "@/components/MatchRing";
import { TcgCard } from "@/components/TcgCard";
import { ContactReveal } from "../ContactReveal";

type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  match_score: number;
  matched_cards: MatchedCard[];
  created_at: string;
};

type CardInfo = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

function timeAgo(iso: string, now: number) {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, match_score, matched_cards, created_at")
    .eq("id", id)
    .returns<MatchRow[]>()
    .maybeSingle();

  if (!match) notFound();

  const isA = match.user_a_id === user.id;
  const counterpartId = isA ? match.user_b_id : match.user_a_id;

  const cardIds = Array.from(new Set(match.matched_cards.map((c) => c.card_id)));

  const [{ data: counterpart }, { data: cards }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, location, verified")
      .eq("id", counterpartId)
      .single(),
    cardIds.length
      ? supabase
          .from("cards")
          .select("id, name, set_name, card_number, image_url")
          .in("id", cardIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cardById = new Map((cards ?? []).map((c) => [c.id, c as CardInfo]));

  const iGive = match.matched_cards.filter((c) =>
    isA ? c.direction === "a_gives" : c.direction === "b_gives",
  );
  const iGet = match.matched_cards.filter((c) =>
    isA ? c.direction === "b_gives" : c.direction === "a_gives",
  );

  const heroGive = cardById.get(iGive[0]?.card_id ?? "");
  const heroGet = cardById.get(iGet[0]?.card_id ?? "");

  // Server Component: renders once per request, so this reads "now" for
  // display, not a re-render-unsafe impurity.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-muted)" }}>
        <Link href="/matches" className="hover:underline">
          Matches
        </Link>
        <ChevronRight size={14} strokeWidth={2} />
        <span style={{ color: "var(--color-text-2-body)" }}>
          {counterpart?.display_name ?? "Unknown trader"}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-violet)" }}
        >
          Discovered {timeAgo(match.created_at, now)}
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">We found a match.</h1>
      </div>

      <div className="grid grid-cols-1 items-center gap-8 px-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
        <div className="flex flex-col items-center gap-4">
          {heroGive && (
            <TcgCard width={200} imageUrl={heroGive.image_url} alt={heroGive.name} />
          )}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
              You have
            </p>
            {heroGive && (
              <>
                <p className="font-semibold">{heroGive.name}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {heroGive.set_name} · #{heroGive.card_number}
                </p>
              </>
            )}
          </div>
        </div>

        <MatchRing score={match.match_score} />

        <div className="flex flex-col items-center gap-4">
          {heroGet && (
            <TcgCard width={200} imageUrl={heroGet.image_url} alt={heroGet.name} />
          )}
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
              They have
            </p>
            {heroGet && (
              <>
                <p className="font-semibold">{heroGet.name}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {heroGet.set_name} · #{heroGet.card_number}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="glass flex flex-col gap-3 rounded-card p-6">
          <h2 className="font-semibold">What&apos;s being matched</h2>
          <div className="flex flex-col gap-2">
            {iGive.map((c) => {
              const card = cardById.get(c.card_id);
              return (
                <div key={`give-${c.card_id}`} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-coral)" }}>You give</span>
                  <span className="text-right font-medium">{card?.name ?? c.card_id}</span>
                </div>
              );
            })}
            {iGet.map((c) => {
              const card = cardById.get(c.card_id);
              return (
                <div key={`get-${c.card_id}`} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-cyan)" }}>You get</span>
                  <span className="text-right font-medium">{card?.name ?? c.card_id}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="flex flex-col gap-4 rounded-card p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="font-semibold">Trading with {counterpart?.display_name}</h2>
          {counterpart?.verified && (
            <span
              className="flex w-fit items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold"
              style={{ color: "var(--color-cyan)", background: "var(--color-cyan-tint)" }}
            >
              <BadgeCheck size={13} strokeWidth={2} />
              Identity Verified
            </span>
          )}
          {counterpart?.location && (
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
              <MapPin size={14} strokeWidth={2} />
              {counterpart.location}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <ContactReveal matchId={match.id} featured />
        <Link href="/matches" className="text-sm underline" style={{ color: "var(--color-muted)" }}>
          Back to matches
        </Link>
      </div>
    </div>
  );
}
