import Link from "next/link";
import { ArrowsLeftRight, MapPin, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { TcgCard } from "./Card";
import { Avatar } from "./Collector";
import { buttonClass, cx, Score } from "./ui";

export type MatchCardSide = {
  name: string;
  setName: string;
  cardNumber: string;
  imageUrl: string | null;
  language?: string | null;
};

/** Up to three cards fanned out; the rest are counted in the caption. */
function Fan({ cards, align }: { cards: MatchCardSide[]; align: "left" | "right" }) {
  const shown = cards.slice(0, 3);
  return (
    <div className={cx("relative flex", align === "right" ? "justify-end" : "justify-start")}>
      {shown.map((c, i) => (
        <div
          key={`${c.name}-${i}`}
          className={cx("w-[78%] max-w-[150px] shrink-0", i > 0 && "-ml-[52%] mt-3")}
          style={{ zIndex: shown.length - i }}
        >
          <TcgCard card={{ name: c.name, set_name: c.setName, card_number: c.cardNumber, image_url: c.imageUrl, language: c.language }} />
        </div>
      ))}
    </div>
  );
}

function names(cards: MatchCardSide[]) {
  if (cards.length === 0) return "—";
  if (cards.length <= 2) return cards.map((c) => c.name).join(" + ");
  return `${cards[0].name} + ${cards.length - 1} more`;
}

/** A potential trade. Glass, because it floats over the discovery surface. */
export function MatchCard({
  id,
  score,
  isNew,
  youGive,
  youGet,
  counterpartId,
  counterpartName,
  counterpartVerified,
  counterpartLocation,
  featured,
  action,
  href,
  linkProfile = true,
}: {
  id: string;
  score: number;
  isNew: boolean;
  youGive: MatchCardSide[];
  youGet: MatchCardSide[];
  counterpartId: string;
  counterpartName: string;
  counterpartVerified: boolean;
  counterpartLocation: string | null;
  featured: boolean;
  action?: React.ReactNode;
  /** Where "View match" goes. Defaults to the match detail page. */
  href?: string;
  /** Link the collector's name to their profile. Off for demo tiles. */
  linkProfile?: boolean;
}) {
  return (
    <article
      className={cx(
        "glass group relative flex flex-col rounded-xl p-5 transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-white/15",
        featured && "md:p-7",
      )}
    >
      <div className="flex items-center justify-between">
        <Score value={score} size={featured ? "lg" : "md"} />
        {isNew && (
          <span className="rounded-full bg-pear/12 px-2.5 py-1 text-xs font-semibold text-pear ring-1 ring-inset ring-pear/25">New</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Fan cards={youGive} align="left" />
        <span className="grid size-10 place-items-center rounded-full bg-night text-pear ring-1 ring-inset ring-pear/30">
          <ArrowsLeftRight size={18} weight="bold" aria-label="trade for" />
        </span>
        <Fan cards={youGet} align="right" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted">You give</div>
          <div className="mt-0.5 line-clamp-2 font-medium text-fg">{names(youGive)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">You receive</div>
          <div className="mt-0.5 line-clamp-2 font-medium text-fg">{names(youGet)}</div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <Avatar seed={counterpartId} verified={counterpartVerified} size={40} />
        <div className="min-w-0 flex-1 text-sm">
          {linkProfile ? (
            <Link href={`/collectors/${counterpartId}`} className="block truncate font-medium text-fg hover:underline">
              {counterpartName}
            </Link>
          ) : (
            <div className="truncate font-medium text-fg">{counterpartName}</div>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted">
            {counterpartVerified ? (
              <span className="inline-flex items-center gap-1 text-seal">
                <SealCheck size={14} weight="fill" aria-hidden /> Identity Verified
              </span>
            ) : (
              <span>Not verified</span>
            )}
            {counterpartLocation && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} aria-hidden /> {counterpartLocation}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={cx("mt-5 grid gap-3", !!action && "grid-cols-2")}>
        <Link
          href={href ?? `/matches/${id}`}
          className={buttonClass(featured ? "primary" : "secondary", "md", "w-full")}
          aria-label={`View match with ${counterpartName}`}
        >
          View match
        </Link>
        {action}
      </div>
    </article>
  );
}
