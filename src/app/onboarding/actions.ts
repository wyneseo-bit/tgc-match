"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshMatchesForUser } from "@/lib/matching";

const MAX_CARDS = 60;

/**
 * Adds the cards picked during onboarding in one go, then runs matching once
 * (adding them one at a time would re-run it per card).
 */
export async function completeOnboarding(haveIds: string[], wantIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", matchCount: 0, firstMatchId: null };

  const haves = Array.from(new Set(haveIds)).slice(0, MAX_CARDS);
  const wants = Array.from(new Set(wantIds)).filter((id) => !haves.includes(id)).slice(0, MAX_CARDS);

  if (haves.length) {
    const { error } = await supabase.from("collection").insert(haves.map((card_id) => ({ user_id: user.id, card_id })));
    if (error) return { error: error.message, matchCount: 0, firstMatchId: null };
  }
  if (wants.length) {
    const { error } = await supabase.from("wants").insert(wants.map((card_id) => ({ user_id: user.id, card_id })));
    if (error) return { error: error.message, matchCount: 0, firstMatchId: null };
  }

  const { matchCount } = await refreshMatchesForUser(user.id);

  const { data: best } = await supabase
    .from("matches")
    .select("id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("match_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  revalidatePath("/collection");
  revalidatePath("/wants");
  revalidatePath("/matches");
  return { error: null, matchCount, firstMatchId: best?.id ?? null };
}
