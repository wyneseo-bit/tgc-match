// Best first, matching the card_condition enum's declared order in
// supabase/schema.sql — the declared order is what Postgres uses to sort it,
// and RANK below relies on this array's order for ranking too.
export const CONDITION_OPTIONS = [
  { value: "near_mint", label: "Near Mint" },
  { value: "lightly_played", label: "Lightly Played" },
  { value: "moderately_played", label: "Moderately Played" },
  { value: "heavily_played", label: "Heavily Played" },
  { value: "damaged", label: "Damaged" },
] as const;

export type Condition = (typeof CONDITION_OPTIONS)[number]["value"];

export function isCondition(value: string): value is Condition {
  return CONDITION_OPTIONS.some((o) => o.value === value);
}

const RANK = new Map<string, number>(
  CONDITION_OPTIONS.map((o, i) => [o.value, i]),
);

// True when `have` is at least as good as the minimum condition `want`
// asks for (a lower rank is a better condition).
export function satisfiesCondition(have: string, want: string) {
  const haveRank = RANK.get(have);
  const wantRank = RANK.get(want);
  if (haveRank === undefined || wantRank === undefined) return false;
  return haveRank <= wantRank;
}

export function conditionLabel(value: string | null | undefined) {
  return CONDITION_OPTIONS.find((o) => o.value === value)?.label ?? null;
}
