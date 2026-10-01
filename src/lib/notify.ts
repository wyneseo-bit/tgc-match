import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationKind =
  | "match_new"
  | "trade_proposed"
  | "trade_accepted"
  | "trade_declined"
  | "trade_cancelled"
  | "trade_confirmed"
  | "trade_completed"
  | "message_new";

/**
 * Records a notification for `userId`. Server-only (service-role client).
 *
 * With a `groupKey`, an existing *unread* notification with the same key is
 * refreshed instead of adding another, so ten messages in one conversation
 * show up as one notification.
 *
 * Never throws: a failed notification must not fail the action that caused it.
 */
export async function notify(
  userId: string,
  n: { kind: NotificationKind; title: string; body?: string; href?: string; groupKey?: string },
) {
  try {
    const admin = createAdminClient();
    const row = {
      user_id: userId,
      kind: n.kind,
      title: n.title,
      body: n.body ?? null,
      href: n.href ?? null,
      group_key: n.groupKey ?? null,
    };

    if (n.groupKey) {
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("group_key", n.groupKey)
        .is("read_at", null)
        .limit(1)
        .maybeSingle();
      if (existing) {
        await admin
          .from("notifications")
          .update({ ...row, created_at: new Date().toISOString() })
          .eq("id", existing.id);
        return;
      }
    }

    await admin.from("notifications").insert(row);
  } catch (err) {
    console.error("notify failed", err);
  }
}
