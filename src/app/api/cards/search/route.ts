import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFilterOptions, searchCardsFiltered } from "@/lib/tcgdex";
import { parseQuery } from "@/lib/card-search";
import { isFinish, isIgnoreKey, type IgnoreKey } from "@/lib/card-filters";

const MAX_PAGE = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const text = searchParams.get("q")?.trim() ?? "";
  const rarity = searchParams.get("rarity") || undefined;
  const type = searchParams.get("type") || undefined;
  const category = searchParams.get("category") || undefined;
  const finishParam = searchParams.get("finish") ?? "";
  const finish = isFinish(finishParam) ? finishParam : undefined;
  const page = Math.min(
    Math.max(Number(searchParams.get("page")) || 1, 1),
    MAX_PAGE,
  );
  const ignore = new Set<IgnoreKey>(
    (searchParams.get("ignore") ?? "").split(",").filter(isIgnoreKey),
  );

  let options: Awaited<ReturnType<typeof getFilterOptions>>;
  try {
    options = await getFilterOptions();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TCGdex request failed" },
      { status: 502 },
    );
  }

  // A set picked in the filter bar wins over one guessed from the text, so
  // don't also try to read a set out of the words.
  const pickedSetId = options.sets.some((s) => s.id === searchParams.get("set"))
    ? searchParams.get("set")!
    : undefined;
  if (pickedSetId) ignore.add("set");

  const query = text.length >= 2 ? text : "";
  const run = async (allowAmbiguousSets: boolean) => {
    const parsed = parseQuery(query, options.sets, ignore, allowAmbiguousSets);
    const hasCriteria =
      parsed.nameText ||
      parsed.setIds.length ||
      parsed.number ||
      pickedSetId ||
      rarity ||
      type ||
      category ||
      finish;
    if (!hasCriteria) {
      return { parsed, result: { cards: [], hasMore: false } };
    }

    const result = await searchCardsFiltered({
      name: parsed.nameText || undefined,
      setIds: pickedSetId ? [pickedSetId] : parsed.setIds,
      number: parsed.number,
      rarity,
      type,
      category,
      finish,
      page,
    });
    return { parsed, result };
  };

  let outcome: Awaited<ReturnType<typeof run>>;
  try {
    outcome = await run(false);
    if (page === 1 && outcome.result.cards.length === 0) {
      // Nothing matched reading e.g. "jungle" as part of a card name — try
      // it as the set instead.
      const second = await run(true);
      if (second.parsed.setIds.join() !== outcome.parsed.setIds.join()) {
        outcome = second;
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TCGdex request failed" },
      { status: 502 },
    );
  }

  const { parsed, result } = outcome;

  if (result.cards.length > 0) {
    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("cards").upsert(result.cards);
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    cards: result.cards,
    hasMore: result.hasMore,
    interpretation: parsed.interpretation,
  });
}
