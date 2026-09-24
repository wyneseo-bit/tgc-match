"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function revealContact(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in" };

  // RLS on matches ("matches visible to matched users") already scopes this
  // select to rows the caller is actually part of.
  const { data: match, error } = await supabase
    .from("matches")
    .select("user_a_id, user_b_id")
    .eq("id", matchId)
    .single();

  if (error || !match) return { error: "Match not found" };

  const counterpartId =
    match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

  const admin = createAdminClient();
  const { data, error: authError } =
    await admin.auth.admin.getUserById(counterpartId);

  if (authError || !data.user) return { error: "Could not load contact" };

  return { email: data.user.email ?? null };
}
