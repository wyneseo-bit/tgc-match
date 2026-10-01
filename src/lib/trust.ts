import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A collector's trading record, counted only from trades made on Trade
 * Matcher. Facts, not a rating.
 */
export type TradingRecord = {
  /** Trades both collectors confirmed. */
  verifiedTrades: number;
  /** Distinct collectors they completed a trade with. */
  uniqueTraders: number;
  /**
   * Completed / (completed + cancelled after being accepted), as a whole
   * percentage. Null until they have at least one accepted trade that ended.
   */
  completionRate: number | null;
  trustedTrader: boolean;
};

// Trusted Trader: a track record, not a single good trade.
export const TRUSTED_MIN_TRADES = 5;
export const TRUSTED_MIN_PARTNERS = 3;
export const TRUSTED_MIN_COMPLETION = 90;

export const EMPTY_RECORD: TradingRecord = {
  verifiedTrades: 0,
  uniqueTraders: 0,
  completionRate: null,
  trustedTrader: false,
};

type Row = {
  proposer_id: string;
  recipient_id: string;
  status: "completed" | "cancelled";
  accepted_at: string | null;
};

/**
 * Trading records for several collectors at once. Uses the service-role
 * client because other collectors' trades aren't visible through RLS; only
 * the aggregate numbers leave this function.
 */
export async function getTradingRecords(userIds: string[]): Promise<Map<string, TradingRecord>> {
  const ids = Array.from(new Set(userIds));
  const records = new Map<string, TradingRecord>(ids.map((id) => [id, { ...EMPTY_RECORD }]));
  if (ids.length === 0) return records;

  const list = ids.join(",");
  const { data, error } = await createAdminClient()
    .from("trades")
    .select("proposer_id, recipient_id, status, accepted_at")
    .in("status", ["completed", "cancelled"])
    .or(`proposer_id.in.(${list}),recipient_id.in.(${list})`)
    .returns<Row[]>();

  if (error) {
    console.error("getTradingRecords failed", error.message);
    return records;
  }

  const partners = new Map<string, Set<string>>(ids.map((id) => [id, new Set()]));
  const brokenAfterAccept = new Map<string, number>(ids.map((id) => [id, 0]));

  for (const t of data ?? []) {
    for (const [me, them] of [
      [t.proposer_id, t.recipient_id],
      [t.recipient_id, t.proposer_id],
    ]) {
      const rec = records.get(me);
      if (!rec) continue;
      if (t.status === "completed") {
        rec.verifiedTrades++;
        partners.get(me)!.add(them);
      } else if (t.accepted_at) {
        brokenAfterAccept.set(me, brokenAfterAccept.get(me)! + 1);
      }
    }
  }

  for (const [id, rec] of records) {
    rec.uniqueTraders = partners.get(id)!.size;
    const ended = rec.verifiedTrades + brokenAfterAccept.get(id)!;
    rec.completionRate = ended > 0 ? Math.round((rec.verifiedTrades / ended) * 100) : null;
    rec.trustedTrader =
      rec.verifiedTrades >= TRUSTED_MIN_TRADES &&
      rec.uniqueTraders >= TRUSTED_MIN_PARTNERS &&
      (rec.completionRate ?? 0) >= TRUSTED_MIN_COMPLETION;
  }

  return records;
}

export async function getTradingRecord(userId: string) {
  return (await getTradingRecords([userId])).get(userId) ?? { ...EMPTY_RECORD };
}
