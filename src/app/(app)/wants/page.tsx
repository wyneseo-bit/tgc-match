import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { EmptyState } from "@/components/EmptyState";
import { WantsBinder, type WantItem } from "./WantsBinder";

export const metadata = { title: "Wants" };

type MatchRow = {
  user_a_id: string;
  matched_cards: MatchedCard[];
};

export default async function WantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data, error }, { data: matches }] = await Promise.all([
    supabase
      .from("wants")
      .select(
        "id, priority, condition, language, card:cards(id, name, set_name, card_number, image_url)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<WantItem[]>(),
    supabase
      .from("matches")
      .select("user_a_id, matched_cards")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .returns<MatchRow[]>(),
  ]);

  if (data && data.length === 0) {
    return (
      <EmptyState
        expression="curious"
        prop="empty-binder"
        title="No empty pockets yet."
        body="Every want is an empty pocket. Add the cards you're hunting for and we'll look for collectors who have them."
        actions={[{ href: "/cards", label: "Find cards you want", variant: "primary" }]}
      />
    );
  }

  // A want is "lit" when it's one of the cards you'd receive in a match.
  const matchCounts: Record<string, number> = {};
  for (const m of matches ?? []) {
    const receiving = m.user_a_id === user.id ? "b_gives" : "a_gives";
    for (const c of m.matched_cards) {
      if (c.direction === receiving) matchCounts[c.card_id] = (matchCounts[c.card_id] ?? 0) + 1;
    }
  }

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your wants</h1>
        <p className="mt-2 max-w-[56ch] text-muted">
          Every empty pocket is a card you&apos;re looking for. Lit pockets are already part of a match.
        </p>
      </header>

      {error && <p className="mt-6 text-sm text-danger">{error.message}</p>}

      <div className="mt-8">
        <WantsBinder items={data ?? []} matchCounts={matchCounts} />
      </div>
    </div>
  );
}
