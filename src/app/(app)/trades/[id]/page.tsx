import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarBlank, Check, MapPin, NotePencil } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { conditionLabel } from "@/lib/card-condition";
import { counterpartOf, loadTrade, mySide, STATUS_LABEL, theirSide, type Trade } from "@/lib/trades";
import { getTradingRecord } from "@/lib/trust";
import { PocketSlot } from "@/components/Card";
import { LocalTime } from "@/components/LocalTime";
import { MessageButton } from "@/components/MessageButton";
import { Pocket } from "@/components/Pocket";
import { VerifiedTradeReceipt } from "@/components/Receipt";
import { TrustPanel } from "@/components/TrustPanel";
import { cx, Panel } from "@/components/ui";
import { TradeActions } from "./TradeActions";

export const metadata = { title: "Trade" };

const STEPS = ["Proposed", "Accepted", "Handover confirmed", "Completed"];

function stepIndex(trade: Trade) {
  if (trade.status === "completed") return 3;
  if (trade.status === "accepted") return trade.proposer_confirmed_at || trade.recipient_confirmed_at ? 2 : 1;
  return 0;
}

async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await createAdminClient().storage.from("trade-photos").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export default async function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS: only the two collectors in the trade can load it.
  const { trade, items } = await loadTrade(supabase, id);
  if (!trade) notFound();

  const them = counterpartOf(trade, user.id);
  const [{ data: counterpart }, { data: me }, record] = await Promise.all([
    supabase.from("users").select("id, display_name, location, verified, created_at").eq("id", them).single(),
    supabase.from("users").select("display_name").eq("id", user.id).single(),
    getTradingRecord(them),
  ]);
  const theirName = counterpart?.display_name ?? "The other collector";
  const myName = me?.display_name ?? "You";

  const given = items.filter((i) => i.giver_id === user.id);
  const received = items.filter((i) => i.giver_id === them);
  const mine = mySide(trade, user.id);
  const theirs = theirSide(trade, user.id);
  const [myPhoto, theirPhoto] = await Promise.all([signed(mine.photoPath), signed(theirs.photoPath)]);
  const step = stepIndex(trade);
  const closed = trade.status === "declined" || trade.status === "cancelled";

  const itemGrid = (list: typeof items) => (
    <div className="mt-3 grid grid-cols-3 gap-3">
      {list.map((i) => (
        <div key={i.id} className="min-w-0">
          <PocketSlot card={i.card ?? { name: i.card_id, image_url: null }} />
          <div className="mt-2 truncate text-xs font-medium text-fg">{i.card?.name ?? i.card_id}</div>
          <div className="truncate text-[11px] text-muted">
            {[conditionLabel(i.condition), i.card?.language === "ja" && "Japanese"].filter(Boolean).join(", ")}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <Link href="/trades" className="-ml-1 inline-flex h-11 items-center gap-2 px-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden /> All trades
      </Link>

      <header className="mt-1 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-sm font-semibold tracking-wider text-muted">TRADE #{trade.code}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {trade.status === "completed" ? "Trade complete." : `Trade with ${theirName}`}
          </h1>
        </div>
        <span
          className={cx(
            "self-start rounded-full px-3 py-1.5 text-sm font-semibold md:self-auto",
            trade.status === "completed"
              ? "bg-seal/12 text-seal ring-1 ring-inset ring-seal/25"
              : closed
                ? "bg-page-2 text-muted"
                : "bg-pear/12 text-pear ring-1 ring-inset ring-pear/25",
          )}
        >
          {STATUS_LABEL[trade.status]}
        </span>
      </header>

      {!closed && (
        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Trade progress">
          {STEPS.map((label, i) => (
            <li key={label} className="min-w-0">
              <div className={cx("h-1.5 rounded-full", i <= step ? "bg-pear" : "bg-page-3")} />
              <div className={cx("mt-2 flex items-center gap-1 truncate text-xs", i <= step ? "text-fg" : "text-muted")}>
                {i < step && <Check size={12} weight="bold" className="shrink-0 text-pear" aria-hidden />}
                {label}
              </div>
            </li>
          ))}
        </ol>
      )}

      {closed && (
        <div className="mt-6 flex items-center gap-4 rounded-lg bg-page p-5 ring-1 ring-inset ring-line">
          <Pocket expression="concerned" size={64} className="shrink-0" />
          <p className="text-fg-2">
            {trade.status === "declined"
              ? trade.recipient_id === user.id
                ? "You declined this trade."
                : `${theirName} declined this trade.`
              : trade.cancelled_by === user.id
                ? "You cancelled this trade."
                : `${theirName} cancelled this trade.`}{" "}
            Your match is still there if you want to try again.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {trade.status === "completed" && trade.completed_at ? (
            <VerifiedTradeReceipt
              code={trade.code}
              given={given}
              received={received}
              completedAt={trade.completed_at}
              myName={myName}
              theirName={theirName}
              className="md:mx-6"
            />
          ) : (
            <Panel className="p-5 md:p-7">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="text-sm font-medium text-fg-2">You give</h2>
                  {itemGrid(given)}
                </div>
                <div>
                  <h2 className="text-sm font-medium text-fg-2">{theirName} gives</h2>
                  {itemGrid(received)}
                </div>
              </div>
            </Panel>
          )}

          <TradeActions
            tradeId={trade.id}
            userId={user.id}
            status={trade.status}
            isProposer={trade.proposer_id === user.id}
            myConfirmed={!!mine.confirmedAt}
            theirConfirmed={!!theirs.confirmedAt}
            theirName={theirName}
          />

          {(myPhoto || theirPhoto) && (
            <Panel className="p-5 md:p-7">
              <h2 className="font-display text-xl font-semibold tracking-tight">Handover photos</h2>
              <p className="mt-1 text-sm text-muted">Only the two of you can see these.</p>
              <div className="mt-4 flex flex-wrap gap-4">
                {[
                  [myPhoto, "Your photo"],
                  [theirPhoto, `${theirName}'s photo`],
                ].map(([url, label]) =>
                  url ? (
                    <a key={label} href={url} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={label!} className="size-36 rounded-md object-cover ring-1 ring-line-2" />
                      <span className="mt-1.5 block text-xs text-muted">{label}</span>
                    </a>
                  ) : null,
                )}
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <h2 className="font-display text-lg font-semibold tracking-tight">Meetup</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin size={17} className="mt-0.5 shrink-0 text-muted" aria-label="Place" />
                <dd className="text-fg">{trade.meetup_place}</dd>
              </div>
              <div className="flex items-start gap-2.5">
                <CalendarBlank size={17} className="mt-0.5 shrink-0 text-muted" aria-label="Time" />
                <dd className="text-fg">
                  {trade.meetup_at ? <LocalTime iso={trade.meetup_at} /> : <span className="text-muted">Time not set. Agree it in messages.</span>}
                </dd>
              </div>
              {trade.note && (
                <div className="flex items-start gap-2.5">
                  <NotePencil size={17} className="mt-0.5 shrink-0 text-muted" aria-label="Note" />
                  <dd className="whitespace-pre-line text-fg-2">{trade.note}</dd>
                </div>
              )}
            </dl>
          </Panel>
          {counterpart && <TrustPanel collector={counterpart} record={record} />}
          <MessageButton userId={them} name={theirName} />
          {trade.match_id && !closed && trade.status !== "completed" && (
            <Link href={`/matches/${trade.match_id}`} className="block text-center text-sm text-muted hover:text-fg">
              View the match
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
