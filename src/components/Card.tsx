import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { cx } from "./ui";

/** The fields every card surface needs, straight from the `cards` table. */
export type CardFace = {
  name: string;
  set_name?: string | null;
  card_number?: string | null;
  image_url: string | null;
};

function alt(card: CardFace) {
  return [card.name, card.set_name, card.card_number && `#${card.card_number}`].filter(Boolean).join(", ");
}

/**
 * The card itself. Real 63 x 88 mm ratio, artwork and border untouched.
 * The platform frames the card; it never paints over it.
 */
export function TcgCard({ card, className }: { card: CardFace; className?: string }) {
  return (
    <div
      className={cx(
        "relative aspect-[63/88] w-full overflow-hidden rounded-[4.6%/3.3%] bg-page-2",
        "shadow-[0_16px_34px_-18px_rgb(0_0_0/0.9)]",
        className,
      )}
    >
      {card.image_url ? (
        // Card images come from whichever catalogue the card was imported
        // from, so they bypass next/image's host allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.image_url} alt={alt(card)} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-between p-[8%] ring-1 ring-inset ring-line-2" role="img" aria-label={alt(card)}>
          <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-fg-2">{card.name}</span>
          <span className="font-mono text-[10px] text-muted">{card.card_number}</span>
        </div>
      )}
    </div>
  );
}

/**
 * A binder pocket holding a card. Hover lifts the card slightly out of the
 * sleeve (scale 1.02, small elevation, soft pear rim). No tilt, no 3D.
 */
export function PocketSlot({
  card,
  highlight,
  tab,
  className,
}: {
  card: CardFace;
  /** Pear rim for the card that is part of a match. */
  highlight?: boolean;
  /** Small binder-divider tab on the pocket, e.g. "Trade". */
  tab?: string;
  className?: string;
}) {
  return (
    <div className={cx("pocket group p-[7%]", highlight && "shadow-[inset_0_0_0_1.5px_var(--color-pear)]", className)}>
      <div className="transition duration-300 ease-soft group-hover:-translate-y-1 group-hover:scale-[1.02]">
        <TcgCard
          card={card}
          className="transition-shadow duration-300 group-hover:shadow-[0_22px_40px_-18px_rgb(0_0_0/0.95),0_0_0_1px_rgb(212_242_106/0.45)]"
        />
      </div>
      <span className="pocket-lip" />
      {tab && (
        <span className="absolute -top-2 right-3 rounded-t-[6px] rounded-b-[3px] bg-pear px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pear-ink">
          {tab}
        </span>
      )}
    </div>
  );
}

/** An empty pocket: a want. Shows a faint ghost of the wanted card. */
export function EmptySlot({
  card,
  lit,
  className,
  children,
}: {
  card?: CardFace;
  /** Pear-lit when someone on the network has it. */
  lit?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx("pocket-empty flex aspect-[63/88] items-center justify-center overflow-hidden p-[7%]", className)}
      data-lit={lit || undefined}
    >
      {card?.image_url && (
        <div className="relative h-full w-full opacity-[0.16] grayscale">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full rounded-[4.6%/3.3%] object-cover" />
        </div>
      )}
      {children}
    </div>
  );
}

/** A dashed pocket that links somewhere to add more cards. */
export function AddPocket({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="pocket-empty group flex aspect-[63/88] flex-col items-center justify-center gap-2 text-fg-2 transition hover:text-pear"
    >
      <span className="grid size-10 place-items-center rounded-full bg-page-2 ring-1 ring-inset ring-line-2 transition group-hover:bg-pear group-hover:text-pear-ink">
        <Plus size={18} weight="bold" aria-hidden />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
