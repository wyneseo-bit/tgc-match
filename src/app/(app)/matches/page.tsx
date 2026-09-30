import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { EmptyState } from "@/components/EmptyState";
import { Pocket } from "@/components/Pocket";
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

export const metadata = { title: "Matches" };

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

  const tiles = (matches ?? []).map((m, i) => {
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
        counterpartId={counterpartId}
        counterpartName={counterpart?.display_name ?? "Unknown trader"}
        counterpartVerified={counterpart?.verified ?? false}
        counterpartLocation={counterpart?.location ?? null}
        featured={i === 0}
        action={<ContactReveal matchId={m.id} />}
      />
    );
  });

  if (error) {
    return <p className="text-sm text-danger">{error.message}</p>;
  }

  if (tiles.length === 0) {
    return (
      <EmptyState
        expression="searching"
        title="Still searching..."
        body="Nobody on the network fits yet. Add more cards you'd trade and more cards you want, and we'll find reciprocal trades automatically."
        actions={[
          { href: "/cards", label: "Add cards", variant: "primary" },
          { href: "/wants", label: "Review wants", variant: "secondary" },
        ]}
      />
    );
  }

  const [featured, ...rest] = tiles;

  return (
    <div>
      <header className="flex items-end gap-4">
        <Pocket expression="excited" prop="card" size={76} className="-mb-1 shrink-0" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            We found {tiles.length} potential trade{tiles.length === 1 ? "" : "s"}.
          </h1>
          <p className="mt-2 text-muted">
            {newCount > 0
              ? `${newCount} new since yesterday. Collectors who have what you want, and want what you have.`
              : "Collectors who have what you want, and want what you have."}
          </p>
        </div>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {featured}
        <div className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">{rest.slice(0, 1)}</div>
      </div>
      {rest.length > 1 && <div className="mt-5 grid gap-5 sm:grid-cols-2">{rest.slice(1)}</div>}
    </div>
  );
}
