import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { POPULAR_CARD_IDS, getCardsByIds, type CachedCard } from "@/lib/tcgdex";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: cached, error: cacheError } = await admin
    .from("cards")
    .select("id, name, set_name, card_number, image_url")
    .in("id", POPULAR_CARD_IDS);

  if (cacheError) {
    return NextResponse.json({ error: cacheError.message }, { status: 500 });
  }

  const cachedById = new Map((cached ?? []).map((c) => [c.id, c as CachedCard]));
  const missingIds = POPULAR_CARD_IDS.filter((id) => !cachedById.has(id));

  if (missingIds.length > 0) {
    try {
      const fetched = await getCardsByIds(missingIds);
      const { error: upsertError } = await admin.from("cards").upsert(fetched);
      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
      fetched.forEach((c) => cachedById.set(c.id, c));
    } catch (err) {
      // Fall back to whatever was already cached rather than failing the
      // whole page over a TCGdex hiccup on a "nice to have" list.
      if (cachedById.size === 0) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "TCGdex request failed" },
          { status: 502 },
        );
      }
    }
  }

  const cards = POPULAR_CARD_IDS.map((id) => cachedById.get(id)).filter(
    (c): c is CachedCard => c !== undefined,
  );

  return NextResponse.json({ cards });
}
