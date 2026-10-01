import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Collector";
import { EmptyState } from "@/components/EmptyState";
import { LocalTime } from "@/components/LocalTime";
import { cx } from "@/components/ui";
import { CONVERSATION_COLUMNS, isUnread, type ConversationRow } from "@/lib/messages";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: only conversations the caller is part of.
  const { data } = await supabase
    .from("conversations")
    .select(CONVERSATION_COLUMNS)
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false })
    .returns<ConversationRow[]>();

  const conversations = data ?? [];
  if (conversations.length === 0) {
    return (
      <EmptyState
        expression="sleeping"
        title="No messages yet."
        body="Message a collector from a match or a trade to agree the details of a meetup."
        actions={[{ href: "/matches", label: "See your matches", variant: "primary" }]}
      />
    );
  }

  const otherIds = conversations.map((c) => (c.user_a_id === user.id ? c.user_b_id : c.user_a_id));
  const { data: people } = await supabase.from("users").select("id, display_name, verified").in("id", otherIds);
  const byId = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Messages</h1>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-lg bg-page ring-1 ring-inset ring-line">
        {conversations.map((c) => {
          const otherId = c.user_a_id === user.id ? c.user_b_id : c.user_a_id;
          const other = byId.get(otherId);
          const unread = isUnread(c, user.id);
          return (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="flex items-center gap-4 px-4 py-4 transition hover:bg-page-2 md:px-5">
                <Avatar seed={otherId} verified={other?.verified} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cx("truncate", unread ? "font-semibold text-fg" : "font-medium text-fg-2")}>
                      {other?.display_name ?? "Collector"}
                    </span>
                    {c.last_message_at && (
                      <span className="shrink-0 text-xs text-muted">
                        <LocalTime iso={c.last_message_at} format="short" />
                      </span>
                    )}
                  </div>
                  <p className={cx("mt-0.5 truncate text-sm", unread ? "text-fg" : "text-muted")}>
                    {c.last_sender_id === user.id && <span className="text-muted">You: </span>}
                    {c.last_message_preview}
                  </p>
                </div>
                {unread && <span className="size-2.5 shrink-0 rounded-full bg-pear" aria-label="Unread" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
