import { ArrowsDownUp, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { conditionLabel } from "@/lib/card-condition";
import type { TradeItem } from "@/lib/trades";
import { LocalTime } from "./LocalTime";
import { cx } from "./ui";

/**
 * Paper is reserved for the trust layer: trade records you could print.
 * Light surface, plain type, nothing decorative except the perforation.
 */
function ReceiptLine({ item, label }: { item: TradeItem; label: string }) {
  const details = [conditionLabel(item.condition), item.card?.language === "ja" && "Japanese"].filter(Boolean).join(", ");
  return (
    <div className="flex items-center gap-4">
      <div className="relative aspect-[63/88] w-14 shrink-0 overflow-hidden rounded-[5%/3.5%] bg-paper-2 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
        {item.card?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.card.image_url} alt={item.card.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-paper-muted">{label}</div>
        <div className="truncate font-display text-lg font-semibold">
          {item.card?.name ?? item.card_id}
          {item.quantity > 1 && <span className="font-sans text-sm font-normal text-paper-muted"> ×{item.quantity}</span>}
        </div>
        <div className="truncate text-sm text-paper-muted">
          {[details, item.card && `${item.card.set_name} #${item.card.card_number}`].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

export function VerifiedTradeReceipt({
  code,
  given,
  received,
  completedAt,
  myName,
  theirName,
  className,
}: {
  code: string;
  given: TradeItem[];
  received: TradeItem[];
  completedAt: string;
  myName: string;
  theirName: string;
  className?: string;
}) {
  return (
    <div className={cx("receipt px-6 pb-7 pt-8 md:px-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-sm font-semibold tracking-wider">TRADE #{code}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcebff] px-2.5 py-1 text-xs font-semibold text-[#0b4a8a]">
          <SealCheck size={14} weight="fill" aria-hidden /> Verified Trade
        </span>
      </div>
      <div className="mt-6 space-y-3">
        {given.map((g) => (
          <ReceiptLine key={g.id} item={g} label={`Given by ${myName}`} />
        ))}
        <div className="flex items-center gap-3 pl-4 text-paper-muted">
          <ArrowsDownUp size={20} aria-hidden />
          <span className="h-px flex-1 bg-paper-2" />
        </div>
        {received.map((g) => (
          <ReceiptLine key={g.id} item={g} label={`Given by ${theirName}`} />
        ))}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-[#c5c9d1] pt-5 text-sm">
        <div>
          <dt className="text-paper-muted">Completed</dt>
          <dd className="mt-0.5 font-medium">
            <LocalTime iso={completedAt} format="date" />
          </dd>
        </div>
        <div>
          <dt className="text-paper-muted">Status</dt>
          <dd className="mt-0.5 font-medium">Both collectors confirmed the handover</dd>
        </div>
      </dl>
    </div>
  );
}
