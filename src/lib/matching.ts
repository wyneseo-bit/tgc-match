import { createAdminClient } from "@/lib/supabase/admin";

type CollectionRow = {
  user_id: string;
  card_id: string;
  condition: string | null;
  grade: string | null;
};

type WantRow = {
  user_id: string;
  card_id: string;
  condition: string | null;
  grade: string | null;
};

export type MatchedCard = {
  // Direction is relative to the sorted (user_a_id, user_b_id) pair, not to
  // whichever user is viewing — the /matches page re-interprets it per viewer.
  direction: "a_gives" | "b_gives";
  card_id: string;
  have_condition: string | null;
  have_grade: string | null;
  want_condition: string | null;
  want_grade: string | null;
};

function groupByUser<T extends { user_id: string }>(rows: T[]) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const list = map.get(row.user_id) ?? [];
    list.push(row);
    map.set(row.user_id, list);
  }
  return map;
}

function scoreMatch(pairs: MatchedCard[]) {
  const exactConditionMatches = pairs.filter(
    (p) =>
      p.have_condition &&
      p.want_condition &&
      p.have_condition === p.want_condition &&
      (p.have_grade ?? null) === (p.want_grade ?? null),
  ).length;

  const overlapScore = Math.min(60, pairs.length * 10);
  const conditionScore = Math.min(20, exactConditionMatches * 5);

  // Phase 1 has no last-active tracking on users, so recency is a flat
  // bonus for now — revisit once real usage data exists (see schema.sql
  // comment: "expect to adjust once real users' edge cases show up").
  const recencyScore = 15;

  return Math.min(100, overlapScore + conditionScore + recencyScore);
}

/**
 * Recomputes every reciprocal match involving `userId` against all other
 * users, and replaces that user's rows in `matches` with the fresh result.
 * Call this after any change to a user's collection or wants.
 */
export async function refreshMatchesForUser(userId: string) {
  const admin = createAdminClient();

  const [{ data: myCollection }, { data: myWants }] = await Promise.all([
    admin
      .from("collection")
      .select("user_id, card_id, condition, grade")
      .eq("user_id", userId)
      .in("trade_status", ["available", "maybe"])
      .returns<CollectionRow[]>(),
    admin
      .from("wants")
      .select("user_id, card_id, condition, grade")
      .eq("user_id", userId)
      .returns<WantRow[]>(),
  ]);

  const myWantByCard = new Map((myWants ?? []).map((w) => [w.card_id, w]));

  const [{ data: otherCollection }, { data: otherWants }] = await Promise.all(
    [
      admin
        .from("collection")
        .select("user_id, card_id, condition, grade")
        .in("trade_status", ["available", "maybe"])
        .neq("user_id", userId)
        .returns<CollectionRow[]>(),
      admin
        .from("wants")
        .select("user_id, card_id, condition, grade")
        .neq("user_id", userId)
        .returns<WantRow[]>(),
    ],
  );

  const collectionByOtherUser = groupByUser(otherCollection ?? []);
  const wantsByOtherUser = groupByUser(otherWants ?? []);

  const candidateUserIds = new Set([
    ...collectionByOtherUser.keys(),
    ...wantsByOtherUser.keys(),
  ]);

  const results = new Map<string, { score: number; matchedCards: MatchedCard[] }>();

  for (const otherUserId of candidateUserIds) {
    const theirCollection = collectionByOtherUser.get(otherUserId) ?? [];
    const theirWants = wantsByOtherUser.get(otherUserId) ?? [];
    const theirWantByCard = new Map(theirWants.map((w) => [w.card_id, w]));

    const iGiveThem = (myCollection ?? []).filter((c) =>
      theirWantByCard.has(c.card_id),
    );
    const theyGiveMe = theirCollection.filter((c) => myWantByCard.has(c.card_id));

    // Reciprocal only: both directions must have at least one match.
    if (iGiveThem.length === 0 || theyGiveMe.length === 0) continue;

    const [userAId] = [userId, otherUserId].sort();
    const iAmA = userAId === userId;

    const pairs: MatchedCard[] = [
      ...iGiveThem.map((c) => {
        const want = theirWantByCard.get(c.card_id)!;
        return {
          direction: iAmA ? ("a_gives" as const) : ("b_gives" as const),
          card_id: c.card_id,
          have_condition: c.condition,
          have_grade: c.grade,
          want_condition: want.condition,
          want_grade: want.grade,
        };
      }),
      ...theyGiveMe.map((c) => {
        const want = myWantByCard.get(c.card_id)!;
        return {
          direction: iAmA ? ("b_gives" as const) : ("a_gives" as const),
          card_id: c.card_id,
          have_condition: c.condition,
          have_grade: c.grade,
          want_condition: want.condition,
          want_grade: want.grade,
        };
      }),
    ];

    results.set(otherUserId, { score: scoreMatch(pairs), matchedCards: pairs });
  }

  // Drop any existing match rows for this user that no longer hold up.
  const { data: existing } = await admin
    .from("matches")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const staleIds = (existing ?? [])
    .filter((row) => {
      const otherId = row.user_a_id === userId ? row.user_b_id : row.user_a_id;
      return !results.has(otherId);
    })
    .map((row) => row.id);

  if (staleIds.length > 0) {
    await admin.from("matches").delete().in("id", staleIds);
  }

  for (const [otherUserId, result] of results) {
    const [userAId, userBId] = [userId, otherUserId].sort();
    await admin.from("matches").upsert(
      {
        user_a_id: userAId,
        user_b_id: userBId,
        match_score: result.score,
        matched_cards: result.matchedCards,
      },
      { onConflict: "user_a_id,user_b_id" },
    );
  }

  return { matchCount: results.size };
}
