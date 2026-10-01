import { createAdminClient } from "@/lib/supabase/admin";

/** The statuses matching treats as tradeable (see refreshMatchesForUser). */
export const TRADEABLE_STATUSES = ["available", "maybe"] as const;

const MAX_IDS = 200;

/**
 * How many other collectors hold each card with a tradeable status.
 *
 * Uses the service-role client because "maybe" cards aren't readable through
 * RLS, but only ever returns counts — never who holds what.
 */
export async function getHolderCounts(cardIds: string[], excludeUserId: string) {
  const ids = Array.from(new Set(cardIds)).slice(0, MAX_IDS);
  const counts: Record<string, number> = {};
  if (ids.length === 0) return counts;

  const { data, error } = await createAdminClient()
    .from("collection")
    .select("card_id, user_id")
    .in("card_id", ids)
    .in("trade_status", [...TRADEABLE_STATUSES])
    .neq("user_id", excludeUserId);

  if (error) throw new Error(error.message);

  const holders = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = holders.get(row.card_id) ?? new Set<string>();
    set.add(row.user_id);
    holders.set(row.card_id, set);
  }
  for (const [cardId, users] of holders) counts[cardId] = users.size;
  return counts;
}
