import Link from "next/link";
import { ArrowsLeftRight, CaretRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  counterpartOf,
  needsMyAction,
  STATUS_LABEL,
  TRADE_COLUMNS,
  type Trade,
  type TradeItem,
} from "@/lib/trades";
import { TcgCard } from "@/components/Card";
import { Avatar } from "@/components/Collector";
import { EmptyState } from "@/components/EmptyState";
import { LocalTime } from "@/components/LocalTime";
import { cx } from "@/components/ui";

export const metadata = { title: "Trades" };

type ItemRow = Pick<TradeItem, "giver_id" | "card"> & { trade_id: string };

function TradeRow({
  trade,
  me,
  them,
  items,
}: {
  trade: Trade;
  me: string;
  them: { id: string; display_name: string } | undefined;
  items: ItemRow[];
}) {
  const give = items.filter((i) => i.giver_id === me);
  const get = items.filter((i) => i.giver_id !== me);
  const action = needsMyAction(trade, me);
  const label = (list: ItemRow[]) =>
    list.length === 0 ? "—" : list.length === 1 ? list[0].card?.name : `${list[0].card?.name} + ${list.length - 1} more`;

  return (
    <li>
      <Link
        href={`/trades/${trade.id}`}
        className={cx(
          "group flex items-center gap-4 rounded-lg bg-page p-4 ring-1 ring-inset transition hover:bg-page-2 md:p-5",
          action ? "ring-pear/40" : "ring-line",
        )}
      >
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="w-10">{give[0]?.card && <TcgCard card={give[0].card} />}</div>
          <ArrowsLeftRight size={14} weight="bold" className="text-pear" aria-hidden />
          <div className="w-10">{get[0]?.card && <TcgCard card={get[0].card} />}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-fg">
            {label(give)} <span className="text-muted">for</span> {label(get)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {them && (
              <span className="inline-flex items-center gap-1.5">
                <Avatar seed={them.id} size={18} /> {them.display_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden /> {trade.meetup_place}
            </span>
            <span className="font-mono">#{trade.code}</span>
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-xs sm:block">
          <div className={cx("font-semibold", action ? "text-pear" : "text-fg-2")}>
            {action ? (trade.status === "proposed" ? "Respond" : "Confirm handover") : STATUS_LABEL[trade.status]}
          </div>
          <div className="mt-0.5 text-muted">
            <LocalTime iso={trade.completed_at ?? trade.created_at} format="short" />
          </div>
        </div>
        <CaretRight size={16} className="shrink-0 text-muted group-hover:text-fg" aria-hidden />
      </Link>
    </li>
  );
}

export default async function TradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS scopes this to trades the caller is part of.
  const { data: trades } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<Trade[]>();

  const list = trades ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        expression="sleeping"
        title="No trades yet."
        body="When you find a match you like, propose a trade from it. Your trades and receipts will live here."
        actions={[{ href: "/matches", label: "See your matches", variant: "primary" }]}
      />
    );
  }

  const ids = list.map((t) => t.id);
  const counterpartIds = Array.from(new Set(list.map((t) => counterpartOf(t, user.id))));
  const [{ data: items }, { data: people }] = await Promise.all([
    supabase
      .from("trade_items")
      .select("trade_id, giver_id, card:cards(id, name, set_name, card_number, image_url)")
      .in("trade_id", ids)
      .returns<ItemRow[]>(),
    supabase.from("users").select("id, display_name").in("id", counterpartIds),
  ]);
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const itemsByTrade = (id: string) => (items ?? []).filter((i) => i.trade_id === id);

  const groups: { title: string; trades: Trade[] }[] = [
    { title: "Needs you", trades: list.filter((t) => needsMyAction(t, user.id)) },
    {
      title: "In progress",
      trades: list.filter((t) => (t.status === "proposed" || t.status === "accepted") && !needsMyAction(t, user.id)),
    },
    { title: "Completed", trades: list.filter((t) => t.status === "completed") },
    { title: "Closed", trades: list.filter((t) => t.status === "declined" || t.status === "cancelled") },
  ];

  const completed = groups[2].trades.length;

  return (
    <div>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your trades</h1>
          <p className="mt-2 text-muted">Meet up, then both confirm. Completed trades become Verified Trades.</p>
        </div>
        <dl className="flex gap-8">
          {[
            ["Open", groups[0].trades.length + groups[1].trades.length],
            ["Verified", completed],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-8 space-y-10">
        {groups
          .filter((g) => g.trades.length > 0)
          .map((g) => (
            <section key={g.title} aria-label={g.title}>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {g.title} <span className="text-base font-normal text-muted">({g.trades.length})</span>
              </h2>
              <ul className="mt-4 space-y-3">
                {g.trades.map((t) => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    me={user.id}
                    them={peopleById.get(counterpartOf(t, user.id))}
                    items={itemsByTrade(t.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
}
