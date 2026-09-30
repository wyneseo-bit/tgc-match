"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cx } from "./ui";

const PER_PAGE = 9;

/** Pad the last page with faint open pockets so every page reads as a full sheet. */
export function fillPage(pockets: ReactNode[]) {
  const rem = pockets.length % PER_PAGE;
  if (rem === 0) return pockets;
  return [
    ...pockets,
    ...Array.from({ length: PER_PAGE - rem }, (_, i) => (
      <div key={`open-${i}`} className="pocket-empty aspect-[63/88] self-start opacity-50" aria-hidden />
    )),
  ];
}

function Page({ children, side }: { children: ReactNode; side: "left" | "right" }) {
  return (
    <div className="relative rounded-lg bg-page p-4 ring-1 ring-inset ring-line md:p-6">
      {/* Ring holes on the spine edge */}
      <div
        className={cx(
          "pointer-events-none absolute inset-y-0 hidden flex-col justify-around py-16 md:flex",
          side === "left" ? "right-2" : "left-2",
        )}
        aria-hidden
      >
        <span className="ring-hole" />
        <span className="ring-hole" />
        <span className="ring-hole" />
      </div>
      <div className={cx("grid grid-cols-3 gap-x-3 gap-y-5 md:gap-x-4", side === "left" ? "md:mr-4" : "md:ml-4")}>{children}</div>
    </div>
  );
}

/**
 * A binder spread: 9 pockets per page, two pages side by side on desktop,
 * one page on mobile. Paging slides like turning a page, nothing more.
 */
export function Binder({ pockets, label }: { pockets: ReactNode[]; label: string }) {
  const reduce = useReducedMotion();
  const pages: ReactNode[][] = [];
  for (let i = 0; i < Math.max(pockets.length, 1); i += PER_PAGE) pages.push(pockets.slice(i, i + PER_PAGE));
  const spreads = Math.ceil(pages.length / 2);
  const [spread, setSpread] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (d: number) => {
    setDir(d);
    setSpread((s) => Math.min(Math.max(s + d, 0), spreads - 1));
  };

  const left = pages[spread * 2] ?? [];
  const right = pages[spread * 2 + 1];

  return (
    <section aria-label={label}>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={spread}
          initial={reduce ? false : { opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-4 xl:grid-cols-2 xl:gap-2"
        >
          <Page side="left">{left}</Page>
          {right ? <Page side="right">{right}</Page> : <div className="hidden rounded-lg bg-page/40 ring-1 ring-inset ring-line xl:block" />}
        </motion.div>
      </AnimatePresence>

      {spreads > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={spread === 0}
            aria-label="Previous pages"
            className="grid size-11 place-items-center rounded-full bg-page-2 text-fg ring-1 ring-inset ring-line-2 transition hover:bg-page-3 disabled:opacity-40"
          >
            <CaretLeft size={18} weight="bold" aria-hidden />
          </button>
          <span className="min-w-28 text-center text-sm tabular-nums text-muted">
            Pages {spread * 2 + 1}
            {right ? `-${spread * 2 + 2}` : ""} of {pages.length}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={spread === spreads - 1}
            aria-label="Next pages"
            className="grid size-11 place-items-center rounded-full bg-page-2 text-fg ring-1 ring-inset ring-line-2 transition hover:bg-page-3 disabled:opacity-40"
          >
            <CaretRight size={18} weight="bold" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
