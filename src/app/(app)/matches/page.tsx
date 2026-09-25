import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { Mascot } from "@/components/Mascot";
import { MatchCard, type MatchCardSide } from "@/components/MatchCard";
import { ContactReveal } from "./ContactReveal";

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

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, match_score, matched_cards, created_at")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("match_score", { ascending: false })
    .returns<MatchRow[]>();

  const counterpartIds = (matches ?? []).map((m) =>
    m.user_a_id === user.id ? m.user_b_id : m.user_a_id,
  );
  const cardIds = new Set<string>();
  (matches ?? []).forEach((m) =>
    m.matched_cards.forEach((c) => cardIds.add(c.card_id)),
  );

  const [{ data: counterparts }, { data: cards }] = await Promise.all([
    counterpartIds.length
      ? supabase
          .from("users")
          .select("id, display_name, location, verified")
          .in("id", counterpartIds)
      : Promise.resolve({ data: [] }),
    cardIds.size
      ? supabase
          .from("cards")
          .select("id, name, set_name, card_number, image_url")
          .in("id", Array.from(cardIds))
      : Promise.resolve({ data: [] }),
  ]);

  const counterpartById = new Map(
    (counterparts ?? []).map((u) => [
      u.id,
      u as { id: string; display_name: string; location: string | null; verified: boolean },
    ]),
  );
  const cardById = new Map((cards ?? []).map((c) => [c.id, c as CardInfo]));

  const toSide = (c: MatchedCard): MatchCardSide => {
    const card = cardById.get(c.card_id);
    return {
      name: card?.name ?? c.card_id,
      setName: card?.set_name ?? "",
      cardNumber: card?.card_number ?? "",
      imageUrl: card?.image_url ?? null,
    };
  };

  // This is a Server Component: it renders once per request, so reading the
  // current time here isn't the re-render impurity the lint rule guards
  // against — it's the whole point (freshness relative to now).
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const newCount = (matches ?? []).filter(
    (m) => now - new Date(m.created_at).getTime() < NEW_WINDOW_MS,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-bold tracking-tight">Your matches</h1>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Collectors who have what you want — and want what you have.
          </span>
        </div>

        {matches && matches.length > 0 && (
          <div className="glass flex items-center gap-3.5 rounded-card py-2.5 pl-3 pr-5">
            <Mascot mood="excited" size={46} color="indigo" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">
                We found {matches.length} potential trade{matches.length === 1 ? "" : "s"}.
              </span>
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                {newCount > 0
                  ? `${newCount} new since yesterday`
                  : "Add more cards to find more"}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error.message}</p>}

      {matches && matches.length === 0 && (
        <div className="glass flex flex-col items-center gap-4 rounded-card px-8 py-16 text-center">
          <Mascot mood="sleeping" size={80} color="violet" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">No matches yet</p>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Add cards to your collection and wants and we&apos;ll find reciprocal
              trades automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {matches?.map((m, i) => {
          const isA = m.user_a_id === user.id;
          const counterpartId = isA ? m.user_b_id : m.user_a_id;
          const counterpart = counterpartById.get(counterpartId);

          const iGive = m.matched_cards
            .filter((c) => (isA ? c.direction === "a_gives" : c.direction === "b_gives"))
            .map(toSide);
          const iGet = m.matched_cards
            .filter((c) => (isA ? c.direction === "b_gives" : c.direction === "a_gives"))
            .map(toSide);

          const isNew = now - new Date(m.created_at).getTime() < NEW_WINDOW_MS;

          return (
            <MatchCard
              key={m.id}
              id={m.id}
              score={m.match_score}
              isNew={isNew}
              youGive={iGive}
              youGet={iGet}
              counterpartName={counterpart?.display_name ?? "Unknown trader"}
              counterpartVerified={counterpart?.verified ?? false}
              counterpartLocation={counterpart?.location ?? null}
              featured={i === 0}
              action={<ContactReveal matchId={m.id} featured={i === 0} />}
            />
          );
        })}
      </div>
    </div>
  );
}
