import Link from "next/link";
import {
  ArrowsLeftRight,
  ChatCircle,
  CheckCircle,
  SealCheck,
  Sparkle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/server";
import type { NotificationKind } from "@/lib/notify";
import { EmptyState } from "@/components/EmptyState";
import { LocalTime } from "@/components/LocalTime";
import { cx } from "@/components/ui";
import { MarkRead } from "./MarkRead";

export const metadata = { title: "Notifications" };

type Row = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

const ICON: Record<NotificationKind, { icon: Icon; tone: string }> = {
  match_new: { icon: Sparkle, tone: "text-pear" },
  trade_proposed: { icon: ArrowsLeftRight, tone: "text-pear" },
  trade_accepted: { icon: CheckCircle, tone: "text-pear" },
  trade_declined: { icon: XCircle, tone: "text-muted" },
  trade_cancelled: { icon: XCircle, tone: "text-muted" },
  trade_confirmed: { icon: CheckCircle, tone: "text-pear" },
  trade_completed: { icon: SealCheck, tone: "text-seal" },
  message_new: { icon: ChatCircle, tone: "text-fg-2" },
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: only the caller's own notifications.
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Row[]>();

  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <EmptyState
        expression="sleeping"
        title="All quiet."
        body="New matches, trade updates and messages will show up here."
        actions={[{ href: "/matches", label: "See your matches", variant: "primary" }]}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <MarkRead hasUnread={rows.some((r) => !r.read_at)} />
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Notifications</h1>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-lg bg-page ring-1 ring-inset ring-line">
        {rows.map((n) => {
          const { icon: KindIcon, tone } = ICON[n.kind] ?? ICON.match_new;
          const body = (
            <div className="flex items-start gap-4 px-4 py-4 md:px-5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-page-2 ring-1 ring-inset ring-line-2">
                <KindIcon size={18} weight="fill" className={tone} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cx("truncate", n.read_at ? "font-medium text-fg-2" : "font-semibold text-fg")}>{n.title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    <LocalTime iso={n.created_at} format="short" />
                  </span>
                </div>
                {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.body}</p>}
              </div>
              {!n.read_at && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-pear" aria-label="Unread" />}
            </div>
          );
          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className="block transition hover:bg-page-2">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
