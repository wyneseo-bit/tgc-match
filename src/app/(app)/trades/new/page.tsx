import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { conditionLabel } from "@/lib/card-condition";
import { OPEN_STATUSES } from "@/lib/trades";
import { TradeProposal, type ProposalCard } from "./TradeProposal";

export const metadata = { title: "Propose trade" };

type CardInfo = { id: string; name: string; set_name: string; card_number: string; image_url: string | null };

export default async function NewTradePage({ searchParams }: { searchParams: Promise<{ match?: string }> }) {
  const { match: matchId } = await searchParams;
  if (!matchId) redirect("/matches");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, matched_cards")
    .eq("id", matchId)
    .maybeSingle<{ id: string; user_a_id: string; user_b_id: string; matched_cards: MatchedCard[] }>();
  if (!match) notFound();

  const isA = match.user_a_id === user.id;
  const them = isA ? match.user_b_id : match.user_a_id;

  // One open trade per pair of collectors at a time.
  const { data: open } = await supabase
    .from("trades")
    .select("id")
    .in("status", OPEN_STATUSES)
    .or(`proposer_id.eq.${them},recipient_id.eq.${them}`)
    .limit(1)
    .maybeSingle();
  if (open) redirect(`/trades/${open.id}`);

  const cardIds = Array.from(new Set(match.matched_cards.map((c) => c.card_id)));
  const [{ data: counterpart }, { data: me }, { data: cards }] = await Promise.all([
    supabase.from("users").select("display_name, location").eq("id", them).single(),
    supabase.from("users").select("location").eq("id", user.id).single(),
    supabase.from("cards").select("id, name, set_name, card_number, image_url").in("id", cardIds).returns<CardInfo[]>(),
  ]);
  const cardById = new Map((cards ?? []).map((c) => [c.id, c]));

  const mine = isA ? "a_gives" : "b_gives";
  const toProposal = (c: MatchedCard): ProposalCard => ({
    id: c.card_id,
    card: cardById.get(c.card_id) ?? { name: c.card_id, image_url: null },
    details: conditionLabel(c.have_condition),
  });

  const name = counterpart?.display_name ?? "this collector";
  // Suggest a place both of you named, if you share one.
  const defaultPlace =
    me?.location && counterpart?.location && me.location.toLowerCase() === counterpart.location.toLowerCase()
      ? me.location
      : "";

  return (
    <div>
      <Link href={`/matches/${match.id}`} className="-ml-1 inline-flex h-11 items-center gap-2 px-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden /> Back to match
      </Link>
      <header className="mt-1">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Propose a trade</h1>
        <p className="mt-2 text-muted">
          {name} gets your proposal and can accept or decline. Nothing changes hands until you both confirm.
        </p>
      </header>
      <div className="mt-8">
        <TradeProposal
          matchId={match.id}
          theirName={name}
          give={match.matched_cards.filter((c) => c.direction === mine).map(toProposal)}
          get={match.matched_cards.filter((c) => c.direction !== mine).map(toProposal)}
          defaultPlace={defaultPlace}
        />
      </div>
    </div>
  );
}
