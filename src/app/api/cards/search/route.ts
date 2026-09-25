import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchCards } from "@/lib/tcgdex";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ cards: [] });
  }

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
    .ilike("name", `%${q}%`)
    .limit(20);

  if (cacheError) {
    return NextResponse.json({ error: cacheError.message }, { status: 500 });
  }

  if (cached && cached.length > 0) {
    return NextResponse.json({ cards: cached });
  }

  // Not in the cache yet — pull from TCGdex and store it for next time.
  let rows: Awaited<ReturnType<typeof searchCards>>;
  try {
    rows = await searchCards(q);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TCGdex request failed" },
      { status: 502 },
    );
  }

  if (rows.length > 0) {
    const { error: upsertError } = await admin.from("cards").upsert(rows);
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ cards: rows });
}
