import Link from "next/link";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import {
  TRUSTED_MIN_COMPLETION,
  TRUSTED_MIN_PARTNERS,
  TRUSTED_MIN_TRADES,
  type TradingRecord,
} from "@/lib/trust";
import { Avatar } from "./Collector";
import { LocalTime } from "./LocalTime";
import { cx, IdentityBadge, TrustChip } from "./ui";

export type TrustCollector = {
  id: string;
  display_name: string;
  location: string | null;
  verified: boolean;
  created_at: string;
};

export function recordFacts(record: TradingRecord): [string, string][] {
  return [
    ["Verified trades", String(record.verifiedTrades)],
    ["Unique traders", String(record.uniqueTraders)],
    ["Completion rate", record.completionRate === null ? "—" : `${record.completionRate}%`],
  ];
}

/**
 * Factual trust panel. Numbers, not stars. Identity verification is shown
 * separately from trading record, because they mean different things.
 */
export function TrustPanel({
  collector,
  record,
  className,
}: {
  collector: TrustCollector;
  record: TradingRecord;
  className?: string;
}) {
  const name = collector.display_name;
  return (
    <section className={cx("rounded-lg bg-page ring-1 ring-inset ring-line", className)} aria-label={`Trust record for ${name}`}>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar seed={collector.id} verified={collector.verified} size={48} />
          <div className="min-w-0">
            <Link href={`/collectors/${collector.id}`} className="block truncate font-medium text-fg hover:underline">
              {name}
            </Link>
            {collector.location && (
              <div className="flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} aria-hidden /> {collector.location}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <IdentityBadge verified={collector.verified} className="mr-2" />
          {record.trustedTrader && <TrustChip kind="trusted" />}
        </div>
        {collector.verified && (
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {name}&apos;s identity was checked by our verification provider. Their trading record is below.
          </p>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line">
        {recordFacts(record).map(([k, v]) => (
          <div key={k} className="bg-page px-5 py-3.5">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-fg">{v}</dd>
          </div>
        ))}
        <div className="bg-page px-5 py-3.5">
          <dt className="text-xs text-muted">Member since</dt>
          <dd className="mt-0.5 font-medium text-fg">
            <LocalTime iso={collector.created_at} format="date" />
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** Full-width trading record for profile pages. */
export function TradingRecordSection({ record, whose }: { record: TradingRecord; whose: string }) {
  return (
    <section aria-label="Trading record" className="rounded-lg bg-page ring-1 ring-inset ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 md:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">Trading record</h2>
          {record.trustedTrader && <TrustChip kind="trusted" />}
        </div>
        <span className="text-sm text-muted">Counted from trades completed on Trade Matcher only</span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-px border-t border-line bg-line">
        {recordFacts(record).map(([k, v]) => (
          <div key={k} className="flex flex-col-reverse bg-page px-5 py-5 md:px-7">
            <dt className="mt-1 text-sm text-muted">{k}</dt>
            <dd className="font-display text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-line px-5 py-4 text-sm text-muted md:px-7">
        Identity Verified means {whose} identity was confirmed by our verification provider. It doesn&apos;t rate trading
        behaviour; the record above does. Trusted Trader takes {TRUSTED_MIN_TRADES}+ verified trades with{" "}
        {TRUSTED_MIN_PARTNERS}+ different collectors and a {TRUSTED_MIN_COMPLETION}%+ completion rate.
      </p>
    </section>
  );
}
