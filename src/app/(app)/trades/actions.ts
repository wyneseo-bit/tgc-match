"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MatchedCard } from "@/lib/matching";
import { notify } from "@/lib/notify";
import { counterpartOf, OPEN_STATUSES, TRADE_COLUMNS, type Trade } from "@/lib/trades";

const PLACE_MAX = 120;
const NOTE_MAX = 500;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

async function displayName(userId: string) {
  const { data } = await createAdminClient().from("users").select("display_name").eq("id", userId).maybeSingle();
  return data?.display_name ?? "A collector";
}

/** Loads a trade the caller is part of, via RLS (so outsiders get nothing). */
async function loadOwnTrade(tradeId: string) {
  const { supabase, user } = await requireUser();
  const { data: trade } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .eq("id", tradeId)
    .returns<Trade[]>()
    .maybeSingle();
  return { user, trade };
}

function revalidateTrade(id: string) {
  revalidatePath("/trades");
  revalidatePath(`/trades/${id}`);
  revalidatePath("/", "layout");
}

export type ProposeInput = {
  matchId: string;
  give: string[];
  get: string[];
  meetupPlace: string;
  /** ISO string, already converted from the proposer's local time. */
  meetupAt: string | null;
  note: string;
};

export async function proposeTrade(input: ProposeInput): Promise<{ error: string }> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const place = input.meetupPlace.trim();
  const note = input.note.trim();
  if (!place) return { error: "Add where you'll meet." };
  if (place.length > PLACE_MAX) return { error: `Meetup place must be ${PLACE_MAX} characters or fewer.` };
  if (note.length > NOTE_MAX) return { error: `Note must be ${NOTE_MAX} characters or fewer.` };
  if (input.meetupAt && Number.isNaN(Date.parse(input.meetupAt))) return { error: "That meetup time isn't valid." };
  if (input.give.length === 0 || input.get.length === 0) {
    return { error: "Pick at least one card on each side." };
  }

  const { data: match } = await admin
    .from("matches")
    .select("id, user_a_id, user_b_id, matched_cards")
    .eq("id", input.matchId)
    .maybeSingle<{ id: string; user_a_id: string; user_b_id: string; matched_cards: MatchedCard[] }>();

  if (!match || (match.user_a_id !== user.id && match.user_b_id !== user.id)) {
    return { error: "That match no longer exists. It may have changed when someone updated their binder." };
  }

  const isA = match.user_a_id === user.id;
  const them = isA ? match.user_b_id : match.user_a_id;
  const mine = isA ? "a_gives" : "b_gives";
  const canGive = new Set(match.matched_cards.filter((c) => c.direction === mine).map((c) => c.card_id));
  const canGet = new Set(match.matched_cards.filter((c) => c.direction !== mine).map((c) => c.card_id));
  const give = Array.from(new Set(input.give));
  const get = Array.from(new Set(input.get));
  if (!give.every((id) => canGive.has(id)) || !get.every((id) => canGet.has(id))) {
    return { error: "Some of those cards aren't part of this match any more. Refresh and try again." };
  }

  const { data: open } = await admin
    .from("trades")
    .select("id")
    .in("status", OPEN_STATUSES)
    .or(`and(proposer_id.eq.${user.id},recipient_id.eq.${them}),and(proposer_id.eq.${them},recipient_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle();
  if (open) return { error: "You already have an open trade with this collector. Finish or cancel it first." };

  // Snapshot each card's condition from the giver's binder.
  const { data: rows } = await admin
    .from("collection")
    .select("user_id, card_id, condition")
    .in("user_id", [user.id, them])
    .in("card_id", [...give, ...get])
    .in("trade_status", ["available", "maybe"]);
  const snapshot = (giver: string, cardId: string) =>
    (rows ?? []).find((r) => r.user_id === giver && r.card_id === cardId);

  const { data: trade, error } = await admin
    .from("trades")
    .insert({
      match_id: match.id,
      proposer_id: user.id,
      recipient_id: them,
      meetup_place: place,
      meetup_at: input.meetupAt,
      note: note || null,
    })
    .select("id")
    .single();
  if (error || !trade) return { error: error?.message ?? "Couldn't create the trade." };

  const items = [
    ...give.map((card_id) => ({ giver_id: user.id, card_id })),
    ...get.map((card_id) => ({ giver_id: them, card_id })),
  ].map((i) => {
    const s = snapshot(i.giver_id, i.card_id);
    return { ...i, trade_id: trade.id, condition: s?.condition ?? null };
  });
  const { error: itemsError } = await admin.from("trade_items").insert(items);
  if (itemsError) {
    await admin.from("trades").delete().eq("id", trade.id);
    return { error: itemsError.message };
  }

  await notify(them, {
    kind: "trade_proposed",
    title: `${await displayName(user.id)} proposed a trade`,
    body: `Meet at ${place}. Review it and accept or decline.`,
    href: `/trades/${trade.id}`,
  });

  revalidateTrade(trade.id);
  redirect(`/trades/${trade.id}`);
}

export async function respondToTrade(tradeId: string, accept: boolean) {
  const { user, trade } = await loadOwnTrade(tradeId);
  if (!trade || trade.recipient_id !== user.id) return { error: "Only the collector it was sent to can respond." };
  if (trade.status !== "proposed") return { error: "This trade has already been answered." };

  const now = new Date().toISOString();
  const { data: updated, error } = await createAdminClient()
    .from("trades")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: now,
      accepted_at: accept ? now : null,
      updated_at: now,
    })
    .eq("id", tradeId)
    .eq("status", "proposed")
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "This trade has already been answered." };

  const name = await displayName(user.id);
  await notify(trade.proposer_id, {
    kind: accept ? "trade_accepted" : "trade_declined",
    title: accept ? `${name} accepted your trade` : `${name} declined your trade`,
    body: accept ? `Meet at ${trade.meetup_place}, then both confirm the handover.` : undefined,
    href: `/trades/${tradeId}`,
  });

  revalidateTrade(tradeId);
  return { error: null };
}

export async function cancelTrade(tradeId: string) {
  const { user, trade } = await loadOwnTrade(tradeId);
  if (!trade) return { error: "Trade not found." };
  // A proposal is withdrawn by its proposer (the recipient declines instead);
  // an agreed meetup can be called off by either side before it completes.
  const allowed =
    (trade.status === "proposed" && trade.proposer_id === user.id) || trade.status === "accepted";
  if (!allowed) return { error: "This trade can't be cancelled now." };

  const now = new Date().toISOString();
  const { data: updated, error } = await createAdminClient()
    .from("trades")
    .update({ status: "cancelled", cancelled_by: user.id, updated_at: now })
    .eq("id", tradeId)
    .eq("status", trade.status)
    .select("id");
  if (error) return { error: error.message };
  if (!updated?.length) return { error: "This trade changed. Refresh to see its latest state." };

  await notify(counterpartOf(trade, user.id), {
    kind: "trade_cancelled",
    title: `${await displayName(user.id)} cancelled a trade`,
    body: `Trade ${trade.code} is off.`,
    href: `/trades/${tradeId}`,
  });

  revalidateTrade(tradeId);
  return { error: null };
}

/**
 * Confirms my side of the handover, optionally with a photo already uploaded
 * to trade-photos/<trade>/<me>/. When both sides have confirmed, the trade is
 * completed and becomes a Verified Trade.
 */
export async function confirmHandover(tradeId: string, photoPath: string | null) {
  const { user, trade } = await loadOwnTrade(tradeId);
  if (!trade) return { error: "Trade not found." };
  if (trade.status !== "accepted") return { error: "Only an agreed trade can be confirmed." };
  if (photoPath && !photoPath.startsWith(`${tradeId}/${user.id}/`)) return { error: "That photo isn't yours." };

  const proposer = trade.proposer_id === user.id;
  const confirmedCol = proposer ? "proposer_confirmed_at" : "recipient_confirmed_at";
  const photoCol = proposer ? "proposer_photo_path" : "recipient_photo_path";
  const now = new Date().toISOString();
  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from("trades")
    .update({ [confirmedCol]: now, ...(photoPath ? { [photoCol]: photoPath } : {}), updated_at: now })
    .eq("id", tradeId)
    .eq("status", "accepted")
    .is(confirmedCol, null)
    .select(TRADE_COLUMNS)
    .returns<Trade[]>();
  if (error) return { error: error.message };
  const fresh = updated?.[0];
  if (!fresh) return { error: "You've already confirmed this trade." };

  const them = counterpartOf(trade, user.id);
  const name = await displayName(user.id);

  if (fresh.proposer_confirmed_at && fresh.recipient_confirmed_at) {
    // Only one of two near-simultaneous confirmations flips it to completed.
    const { data: done } = await admin
      .from("trades")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", tradeId)
      .eq("status", "accepted")
      .select("id");
    if (done?.length) {
      for (const who of [user.id, them]) {
        await notify(who, {
          kind: "trade_completed",
          title: `Trade ${trade.code} is complete`,
          body: "Both collectors confirmed. It now counts as a Verified Trade.",
          href: `/trades/${tradeId}`,
        });
      }
    }
  } else {
    await notify(them, {
      kind: "trade_confirmed",
      title: `${name} confirmed the handover`,
      body: "Confirm your side to complete the trade.",
      href: `/trades/${tradeId}`,
    });
  }

  revalidateTrade(tradeId);
  return { error: null };
}

