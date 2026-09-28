import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFilterOptions } from "@/lib/tcgdex";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getFilterOptions());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TCGdex request failed" },
      { status: 502 },
    );
  }
}
