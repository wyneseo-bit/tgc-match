"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowsLeftRight, SealCheck } from "@phosphor-icons/react";
import { demo as c } from "@/lib/demo";
import { EmptySlot, PocketSlot } from "../Card";
import { Avatar } from "../Collector";
import { cx } from "../ui";

const TABS = [
  {
    id: "have",
    tab: "I have",
    title: "Put your binder online.",
    body: "Add the cards you own and mark the ones you'd trade. Only those are shown to matching collectors.",
  },
  {
    id: "want",
    tab: "I want",
    title: "Leave pockets empty on purpose.",
    body: "Every want is an empty pocket. A pocket lights up the moment someone on the network holds that card.",
  },
  {
    id: "match",
    tab: "Find matches",
    title: "We pull the thread.",
    body: "We look for collectors who have your wants and want your haves, then rank them by overlap and card condition.",
  },
  {
    id: "trade",
    tab: "Trade",
    title: "See it, then settle it.",
    body: "Every match shows exactly what you give, what you get, and each card's condition. Reveal contact when you're ready.",
  },
  {
    id: "trust",
    tab: "Build trust",
    title: "Know who you're trading with.",
    body: "Identity Verified is shown on every match, kept separate from anything that rates behaviour.",
  },
] as const;

function Visual({ id }: { id: (typeof TABS)[number]["id"] }) {
  switch (id) {
    case "have":
      return (
        <div className="grid w-full max-w-[360px] grid-cols-3 gap-3">
          {(["charizardEx", "rayquaza", "lugia", "gengar", "baseCharizard", "iono"] as const).map((k, i) => (
            <PocketSlot key={k} card={c(k)} tab={i % 2 === 0 ? "Trade" : undefined} />
          ))}
        </div>
      );
    case "want":
      return (
        <div className="grid w-full max-w-[360px] grid-cols-3 gap-3">
          {(["umbreon", "mewEx", "gardevoir", "giratina", "blastoise", "altaria"] as const).map((k, i) => (
            <EmptySlot key={k} card={c(k)} lit={i !== 4} />
          ))}
        </div>
      );
    case "match":
      return (
        <div className="flex w-full max-w-[380px] items-center gap-4">
          <PocketSlot card={c("charizardEx")} highlight className="flex-1" />
          <div className="flex flex-col items-center">
            <span className="font-display text-3xl font-bold text-pear">96%</span>
            <span className="text-[10px] font-semibold tracking-[0.18em] text-pear/80">MATCH</span>
            <ArrowsLeftRight size={18} weight="bold" className="mt-2 text-fg-2" aria-hidden />
          </div>
          <PocketSlot card={c("umbreon")} highlight className="flex-1" />
        </div>
      );
    case "trade":
      return (
        <div className="w-full max-w-[360px] rounded-lg bg-page-2 p-5 ring-1 ring-inset ring-line-2">
          {[
            ["You give", "Charizard ex, Near Mint"],
            ["You receive", "Umbreon VMAX, Near Mint"],
            ["They asked for", "Lightly Played or better"],
            ["Match", "96%"],
            ["Contact", "Revealed when you choose"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
              <span className="text-muted">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      );
    case "trust":
      return (
        <div className="w-full max-w-[340px] rounded-lg bg-page-2 p-5 ring-1 ring-inset ring-line-2">
          <div className="flex items-center gap-3">
            <Avatar seed="demo-aiman" verified size={44} />
            <div>
              <div className="font-medium text-fg">Aiman R.</div>
              <div className="inline-flex items-center gap-1 text-sm font-medium text-seal">
                <SealCheck size={15} weight="fill" aria-hidden /> Identity Verified
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            Checked by our verification provider. It confirms who someone is, not how they trade.
          </p>
        </div>
      );
  }
}

/**
 * I HAVE, I WANT, FIND MATCHES, TRADE, BUILD TRUST as binder index dividers.
 * Each tab sits at a different height, like real dividers do.
 */
export function LoopTabs() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const t = TABS[active];

  return (
    <div>
      <div role="tablist" aria-label="How it works" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={i === active}
            aria-controls="loop-panel"
            onClick={() => setActive(i)}
            className={cx(
              "relative shrink-0 rounded-t-lg px-4 pb-3 text-left text-sm font-semibold transition-colors md:flex-1 md:px-5",
              i === active ? "bg-page pt-4 text-fg" : "mt-2 bg-cover pt-3 text-muted hover:text-fg-2",
            )}
          >
            <span className={cx("mr-2 font-mono text-xs", i === active ? "text-pear" : "text-muted")}>{i + 1}</span>
            {tab.tab}
          </button>
        ))}
      </div>
      <div
        id="loop-panel"
        role="tabpanel"
        aria-labelledby={`tab-${t.id}`}
        className="grid min-h-[420px] items-center gap-10 rounded-b-xl rounded-tr-xl bg-page p-6 md:grid-cols-2 md:p-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={t.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h3>
            <p className="mt-4 max-w-[42ch] text-lg text-fg-2">{t.body}</p>
            {active < TABS.length - 1 && (
              <button type="button" onClick={() => setActive(active + 1)} className="mt-8 text-sm font-medium text-pear hover:underline">
                Next: {TABS[active + 1].tab}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={t.id}
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex justify-center"
          >
            <Visual id={t.id} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
