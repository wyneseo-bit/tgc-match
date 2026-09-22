"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function addToCollection(cardId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("collection")
    .insert({ user_id: user.id, card_id: cardId });

  if (error) return { error: error.message };

  revalidatePath("/collection");
  return { error: null };
}

export async function updateTradeStatus(id: string, tradeStatus: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("collection")
    .update({ trade_status: tradeStatus })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/collection");
  return { error: null };
}

export async function updateQuantity(id: string, quantity: number) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("collection")
    .update({ quantity })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/collection");
  return { error: null };
}

export async function removeFromCollection(id: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("collection")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/collection");
  return { error: null };
}
