import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";

type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  match_score: number;
  matched_cards: MatchedCard[];
};

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
};

function CardList({ cards, cardById }: { cards: MatchedCard[]; cardById: Map<string, Card> }) {
  if (cards.length === 0) {
    return <p className="text-sm text-zinc-400">None</p>;
  }

  return (
    <ul className="space-y-1">
      {cards.map((c) => {
        const card = cardById.get(c.card_id);
        return (
          <li key={c.card_id} className="text-sm">
            {card ? `${card.name} (${card.set_name} #${card.card_number})` : c.card_id}
          </li>
        );
      })}
    </ul>
  );
}

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, match_score, matched_cards")
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
      ? supabase.from("users").select("id, display_name, location").in("id", counterpartIds)
      : Promise.resolve({ data: [] }),
    cardIds.size
      ? supabase
          .from("cards")
          .select("id, name, set_name, card_number")
          .in("id", Array.from(cardIds))
      : Promise.resolve({ data: [] }),
  ]);

  const counterpartById = new Map(
    (counterparts ?? []).map((u) => [u.id, u as { id: string; display_name: string; location: string | null }]),
  );
  const cardById = new Map((cards ?? []).map((c) => [c.id, c as Card]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Matches</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/collection" className="underline">
            My Collection
          </Link>
          <Link href="/wants" className="underline">
            My Wants
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {matches && matches.length === 0 && (
        <p className="text-zinc-500">
          No matches yet — add cards to your{" "}
          <Link href="/collection" className="underline">
            collection
          </Link>{" "}
          and{" "}
          <Link href="/wants" className="underline">
            wants
          </Link>{" "}
          and we&apos;ll find reciprocal trades automatically.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {matches?.map((m) => {
          const isA = m.user_a_id === user.id;
          const counterpartId = isA ? m.user_b_id : m.user_a_id;
          const counterpart = counterpartById.get(counterpartId);

          const iGive = m.matched_cards.filter((c) =>
            isA ? c.direction === "a_gives" : c.direction === "b_gives",
          );
          const iGet = m.matched_cards.filter((c) =>
            isA ? c.direction === "b_gives" : c.direction === "a_gives",
          );

          return (
            <div key={m.id} className="rounded border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {counterpart?.display_name ?? "Unknown trader"}
                  </p>
                  {counterpart?.location && (
                    <p className="text-xs text-zinc-500">{counterpart.location}</p>
                  )}
                </div>
                <p className="text-sm font-semibold">{m.match_score}% match</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                    You give
                  </p>
                  <CardList cards={iGive} cardById={cardById} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                    You get
                  </p>
                  <CardList cards={iGet} cardById={cardById} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
