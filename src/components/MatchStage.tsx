"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { PocketSlot, type CardFace } from "./Card";
import { Avatar } from "./Collector";
import { cx } from "./ui";

const ease = [0.16, 1, 0.3, 1] as const;
/** Pockets shown per side; anything beyond is listed in the table below the stage. */
const MAX_POCKETS = 4;

export type StageCard = { key: string; card: CardFace; condition: string | null };

function ConditionTag({ label }: { label: string }) {
  return <span className="inline-flex h-6 items-center rounded-sm bg-white/5 px-2 font-mono text-[11px] font-medium text-fg-2">{label}</span>;
}

function Details({
  who,
  cards,
  wants,
  align,
}: {
  who: "You" | "They";
  cards: StageCard[];
  wants: StageCard[];
  align: "left" | "right";
}) {
  return (
    <dl className={cx("mt-5 space-y-3 text-sm", align === "right" && "text-right")}>
      <div>
        <dt className="text-muted">{who} have</dt>
        <dd className="mt-1 space-y-1">
          {cards.map((c) => (
            <div key={c.key} className={cx("flex flex-wrap items-center gap-2", align === "right" && "justify-end")}>
              <span className="font-display text-base font-semibold text-fg md:text-lg">{c.card.name}</span>
              {c.condition && <ConditionTag label={c.condition} />}
            </div>
          ))}
        </dd>
      </div>
      <div>
        <dt className="text-muted">{who} want</dt>
        <dd className="mt-1 font-medium text-fg-2">{wants.map((w) => w.card.name).join(" + ")}</dd>
      </div>
    </dl>
  );
}

/**
 * The discovery moment. Your side and theirs, pulled together by a pear thread.
 * Sequence: cards slide in, thread draws, score lands. Under 1s in total.
 */
export function MatchStage({
  score,
  give,
  receive,
  them,
}: {
  score: number;
  give: StageCard[];
  receive: StageCard[];
  them: { id: string; name: string; verified: boolean };
}) {
  const reduce = useReducedMotion();
  const width = (n: number) => (n > 1 ? "w-[min(42vw,340px)]" : "w-[min(34vw,230px)]");

  const slide = (from: number) => ({
    initial: reduce ? false : { opacity: 0, x: from },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease },
  });

  const pockets = (cards: StageCard[]) =>
    cards.slice(0, MAX_POCKETS).map((c) => <PocketSlot key={c.key} card={c.card} highlight />);

  return (
    <section
      aria-label="Match overview"
      className="relative overflow-hidden rounded-xl bg-cover px-4 py-6 ring-1 ring-inset ring-line md:px-10 md:py-9"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_18rem_at_50%_40%,rgb(212_242_106/0.07),transparent_70%)]" />

      <div className="relative grid grid-cols-[auto_minmax(48px,1fr)_auto] items-center">
        {/* Row 1: who */}
        <div className="mb-4 flex h-9 items-center">
          <span className="rounded-full bg-page-2 px-3 py-1.5 text-sm font-semibold tracking-wide text-fg-2">YOU</span>
        </div>
        <div />
        <div className="mb-4 flex h-9 min-w-0 items-center justify-end gap-2 text-sm font-semibold tracking-wide text-fg-2">
          <Avatar seed={them.id} verified={them.verified} size={32} />
          <span className="truncate uppercase">{them.name}</span>
        </div>

        {/* Row 2: pockets + thread */}
        <motion.div {...slide(-28)} className={cx("grid gap-3", width(give.length), give.length > 1 && "grid-cols-2")}>
          {pockets(give)}
        </motion.div>

        <div className="relative flex h-full items-center justify-center">
          <svg
            className="absolute -inset-x-3 top-1/2 h-28 w-[calc(100%+24px)] -translate-y-1/2 overflow-visible"
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <motion.path
              d="M0 50 C 60 8, 140 8, 200 50"
              fill="none"
              stroke="var(--color-pear)"
              strokeWidth={1.6}
              vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.75 }}
              transition={{ delay: 0.35, duration: 0.55, ease }}
            />
            <motion.path
              d="M200 50 C 140 92, 60 92, 0 50"
              fill="none"
              stroke="var(--color-pear)"
              strokeWidth={1.6}
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 0.6, duration: 0.4, ease }}
            />
          </svg>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75, duration: 0.4, ease }}
            className="relative flex flex-col items-center rounded-2xl bg-night px-2 py-3 ring-1 ring-inset ring-pear/30 md:px-5 md:py-4"
          >
            <span className="font-display text-2xl font-bold tracking-tight text-pear tabular-nums md:text-5xl">{score}%</span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-pear/80 md:text-xs">MATCH</span>
            <ArrowsLeftRight size={18} weight="bold" className="mt-2 text-fg-2" aria-hidden />
          </motion.div>
        </div>

        <motion.div
          {...slide(28)}
          className={cx("grid gap-3 justify-self-end", width(receive.length), receive.length > 1 && "grid-cols-2")}
        >
          {pockets(receive)}
        </motion.div>

        {/* Row 3: has / wants */}
        <div className={cx("self-start", width(give.length))}>
          <Details who="You" cards={give} wants={receive} align="left" />
        </div>
        <div />
        <div className={cx("self-start justify-self-end", width(receive.length))}>
          <Details who="They" cards={receive} wants={give} align="right" />
        </div>
      </div>
    </section>
  );
}
