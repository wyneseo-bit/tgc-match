import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarBlank, Check, MapPin } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import type { MatchedCard } from "@/lib/matching";
import { CONDITION_OPTIONS, satisfiesCondition } from "@/lib/card-condition";
import { TcgCard } from "@/components/Card";
import { Avatar } from "@/components/Collector";
import { MatchStage, type StageCard } from "@/components/MatchStage";
import { IdentityBadge, Panel } from "@/components/ui";
import { ContactReveal } from "../ContactReveal";

export const metadata = { title: "Match" };

type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  match_score: number;
  matched_cards: MatchedCard[];
  created_at: string;
};

type CardInfo = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
  language?: string | null;
};

function timeAgo(iso: string, now: number) {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function conditionLabel(value: string | null) {
  return CONDITION_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

function meetsWant(c: MatchedCard) {
  return !!c.have_condition && !!c.want_condition && satisfiesCondition(c.have_condition, c.want_condition);
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: match } = await supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, match_score, matched_cards, created_at")
    .eq("id", id)
    .returns<MatchRow[]>()
    .maybeSingle();

  if (!match) notFound();

  const isA = match.user_a_id === user.id;
  const counterpartId = isA ? match.user_b_id : match.user_a_id;

  const cardIds = Array.from(new Set(match.matched_cards.map((c) => c.card_id)));

  const [{ data: counterpart }, { data: cards }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, location, verified, created_at")
      .eq("id", counterpartId)
      .single(),
    cardIds.length
      ? supabase
          .from("cards")
          .select("id, name, set_name, card_number, image_url, language")
          .in("id", cardIds)
      : Promise.resolve({ data: [] }),
  ]);

  const cardById = new Map((cards ?? []).map((c) => [c.id, c as CardInfo]));

  const iGive = match.matched_cards.filter((c) =>
    isA ? c.direction === "a_gives" : c.direction === "b_gives",
  );
  const iGet = match.matched_cards.filter((c) =>
    isA ? c.direction === "b_gives" : c.direction === "a_gives",
  );

  const toStage = (c: MatchedCard): StageCard => ({
    key: `${c.direction}-${c.card_id}`,
    card: cardById.get(c.card_id) ?? { name: c.card_id, image_url: null },
    condition: conditionLabel(c.have_condition),
  });

  // Server Component: renders once per request, so this reads "now" for
  // display, not a re-render-unsafe impurity.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const name = counterpart?.display_name ?? "Unknown trader";
  const meeting = match.matched_cards.filter(meetsWant).length;
  const reasons = [
    `They have ${iGet.length} card${iGet.length === 1 ? "" : "s"} from your want list`,
    `They want ${iGive.length} card${iGive.length === 1 ? "" : "s"} you'd trade`,
    `${meeting} of ${match.matched_cards.length} cards meet the condition asked for`,
    counterpart?.verified ? `${name}'s identity is verified` : `Discovered ${timeAgo(match.created_at, now)}`,
  ];

  const memberSince = counterpart?.created_at
    ? new Date(counterpart.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  const rows = [
    ...iGive.map((c) => ({ c, side: "You give" })),
    ...iGet.map((c) => ({ c, side: "You receive" })),
  ];

  return (
    <div>
      <Link href="/matches" className="-ml-1 inline-flex h-11 items-center gap-2 px-1 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden /> All matches
      </Link>

      <header className="mt-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pear/80">
          Discovered {timeAgo(match.created_at, now)}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight md:text-5xl">We found a match.</h1>
        <p className="mt-2 text-lg text-muted">
          {name} has what you&apos;re looking for, and wants what you have.
        </p>
      </header>

      <div className="mt-8">
        <MatchStage
          score={match.match_score}
          give={iGive.map(toStage)}
          receive={iGet.map(toStage)}
          them={{ id: counterpartId, name, verified: counterpart?.verified ?? false }}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel className="p-5 md:p-7">
            <h2 className="font-display text-xl font-semibold tracking-tight">Why this is a match</h2>
            <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {reasons.map((r) => (
                <li key={r} className="flex items-start gap-3 text-fg-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-pear/15 text-pear">
                    <Check size={12} weight="bold" aria-hidden />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-5 md:p-7">
            <h2 className="font-display text-xl font-semibold tracking-tight">What&apos;s being matched</h2>
            <ul className="mt-4 divide-y divide-line">
              {rows.map(({ c, side }) => {
                const card = cardById.get(c.card_id);
                const have = conditionLabel(c.have_condition);
                const want = conditionLabel(c.want_condition);
                return (
                  <li key={`${c.direction}-${c.card_id}`} className="flex items-center gap-4 py-3">
                    <div className="w-11 shrink-0">
                      <TcgCard card={card ?? { name: c.card_id, image_url: null }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted">{side}</div>
                      <div className="truncate font-medium text-fg">{card?.name ?? c.card_id}</div>
                      {card && (
                        <div className="truncate text-xs text-muted">
                          {card.set_name}, #{card.card_number}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      {have && <div className="text-fg-2">{have}</div>}
                      {want && (
                        <div className={meetsWant(c) ? "text-pear" : "text-warn"}>
                          Wants {want} or better
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg bg-page ring-1 ring-inset ring-line" aria-label={`About ${name}`}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar seed={counterpartId} verified={counterpart?.verified ?? false} size={48} />
                <div className="min-w-0">
                  <Link href={`/collectors/${counterpartId}`} className="block truncate font-medium text-fg hover:underline">
                    {name}
                  </Link>
                  {counterpart?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted">
                      <MapPin size={14} aria-hidden /> {counterpart.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <IdentityBadge verified={counterpart?.verified ?? false} />
              </div>
              {counterpart?.verified && (
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  {name}&apos;s identity was checked by our verification provider. It confirms who they are, not how they trade.
                </p>
              )}
            </div>
            {memberSince && (
              <div className="flex items-center gap-2 border-t border-line px-5 py-3.5 text-sm text-fg-2">
                <CalendarBlank size={15} className="text-muted" aria-hidden /> Member since {memberSince}
              </div>
            )}
          </section>
          <ContactReveal matchId={match.id} size="lg" variant="primary" className="w-full" />
          <p className="text-center text-xs text-muted">Reveal {name}&apos;s email to arrange the trade.</p>
        </aside>
      </div>
    </div>
  );
}
