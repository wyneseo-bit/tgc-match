import type { SupabaseClient } from "@supabase/supabase-js";

export type TradeStatus = "proposed" | "accepted" | "declined" | "cancelled" | "completed";

export type Trade = {
  id: string;
  code: string;
  match_id: string | null;
  proposer_id: string;
  recipient_id: string;
  status: TradeStatus;
  meetup_place: string;
  meetup_at: string | null;
  note: string | null;
  accepted_at: string | null;
  responded_at: string | null;
  cancelled_by: string | null;
  proposer_confirmed_at: string | null;
  recipient_confirmed_at: string | null;
  proposer_photo_path: string | null;
  recipient_photo_path: string | null;
  completed_at: string | null;
  created_at: string;
};

export type TradeItem = {
  id: string;
  giver_id: string;
  card_id: string;
  condition: string | null;
  quantity: number;
  card: {
    id: string;
    name: string;
    set_name: string;
    card_number: string;
    image_url: string | null;
    language: string | null;
  } | null;
};

export const TRADE_COLUMNS =
  "id, code, match_id, proposer_id, recipient_id, status, meetup_place, meetup_at, note, accepted_at, responded_at, cancelled_by, proposer_confirmed_at, recipient_confirmed_at, proposer_photo_path, recipient_photo_path, completed_at, created_at";

export const TRADE_ITEM_COLUMNS =
  "id, giver_id, card_id, condition, quantity, card:cards(id, name, set_name, card_number, image_url, language)";

export const OPEN_STATUSES: TradeStatus[] = ["proposed", "accepted"];

export const STATUS_LABEL: Record<TradeStatus, string> = {
  proposed: "Proposed",
  accepted: "Meetup agreed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function counterpartOf(trade: Pick<Trade, "proposer_id" | "recipient_id">, me: string) {
  return trade.proposer_id === me ? trade.recipient_id : trade.proposer_id;
}

/** My side's confirmation and photo, whichever role I have. */
export function mySide(trade: Trade, me: string) {
  const proposer = trade.proposer_id === me;
  return {
    confirmedAt: proposer ? trade.proposer_confirmed_at : trade.recipient_confirmed_at,
    photoPath: proposer ? trade.proposer_photo_path : trade.recipient_photo_path,
  };
}

export function theirSide(trade: Trade, me: string) {
  return mySide(trade, counterpartOf(trade, me));
}

/** Whether the trade is waiting on *me* to do something. */
export function needsMyAction(trade: Trade, me: string) {
  if (trade.status === "proposed") return trade.recipient_id === me;
  if (trade.status === "accepted") return !mySide(trade, me).confirmedAt;
  return false;
}

export async function loadTrade(supabase: SupabaseClient, id: string) {
  const [{ data: trade }, { data: items }] = await Promise.all([
    supabase.from("trades").select(TRADE_COLUMNS).eq("id", id).returns<Trade[]>().maybeSingle(),
    supabase.from("trade_items").select(TRADE_ITEM_COLUMNS).eq("trade_id", id).returns<TradeItem[]>(),
  ]);
  return { trade, items: items ?? [] };
}

