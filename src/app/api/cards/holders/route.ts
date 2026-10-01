import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHolderCounts } from "@/lib/holders";

// GET /api/cards/holders?ids=a,b,c → { counts: { [cardId]: number } }
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    return NextResponse.json({ counts: await getHolderCounts(ids, user.id) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
