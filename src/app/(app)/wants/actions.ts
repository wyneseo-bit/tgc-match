"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshMatchesForUser } from "@/lib/matching";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  return { supabase, user };
}

export async function addToWants(cardId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("wants")
    .insert({ user_id: user.id, card_id: cardId });

  if (error) return { error: error.message };

  await refreshMatchesForUser(user.id);
  revalidatePath("/wants");
  revalidatePath("/matches");
  return { error: null };
}

export async function updatePriority(id: string, priority: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("wants")
    .update({ priority })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/wants");
  return { error: null };
}

export async function removeFromWants(id: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("wants")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await refreshMatchesForUser(user.id);
  revalidatePath("/wants");
  revalidatePath("/matches");
  return { error: null };
}
