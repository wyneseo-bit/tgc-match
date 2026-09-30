"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, SealCheck } from "@phosphor-icons/react";
import { demo, DEMO_COLLECTOR, type DemoCardKey } from "@/lib/demo";
import { EmptySlot, PocketSlot } from "../Card";
import { Avatar } from "../Collector";
import { Pocket } from "../Pocket";
import { cx } from "../ui";

const ease = [0.16, 1, 0.3, 1] as const;

type Slot = { id: DemoCardKey; empty?: boolean; key?: string };

const MINE: Slot[] = [
  { id: "charizardEx", key: "give" },
  { id: "mewEx" },
  { id: "rayquaza" },
  { id: "lugia" },
  { id: "umbreon", empty: true, key: "want" },
  { id: "gardevoir" },
];
const THEIRS: Slot[] = [
  { id: "giratina" },
  { id: "umbreon", key: "get" },
  { id: "gengar" },
  { id: "pikachu" },
  { id: "iono" },
  { id: "charizardEx", empty: true, key: "their-want" },
];

type Path = { d: string; key: string };

function curve(a: DOMRect, b: DOMRect, box: DOMRect, lift: number): string {
  const x1 = a.left + a.width / 2 - box.left;
  const y1 = a.top + a.height / 2 - box.top;
  const x2 = b.left + b.width / 2 - box.left;
  const y2 = b.top + b.height / 2 - box.top;
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) + lift;
  return `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

/**
 * Hero visual: your binder page and a collector's page. One thread runs from
 * their Umbreon to your empty Umbreon pocket, the other from your Charizard
 * to their empty pocket. That is the whole product in one picture.
 */
export function HeroBinders() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<Path[]>([]);
  const aiman = DEMO_COLLECTOR;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      const r = (k: string) => refs.current[k]?.getBoundingClientRect();
      const get = r("get"), want = r("want"), give = r("give"), theirWant = r("their-want");
      if (!get || !want || !give || !theirWant) return;
      setPaths([
        { key: "a", d: curve(get, want, b, b.height * 0.28) },
        { key: "b", d: curve(give, theirWant, b, -b.height * 0.2) },
      ]);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const page = (slots: Slot[], side: "mine" | "theirs") => (
    <div className="grid grid-cols-3 gap-[6%]">
      {slots.map((s) => (
        <div key={`${side}-${s.id}`} ref={(n) => { if (s.key) refs.current[s.key] = n; }}>
          {s.empty ? (
            <EmptySlot card={demo(s.id)} lit />
          ) : (
            <PocketSlot card={demo(s.id)} highlight={!!s.key} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div ref={box} className="relative mx-auto w-full max-w-[760px] select-none pb-24 pt-16 md:pb-20 md:pt-20">
      <div className="grid grid-cols-2 items-start gap-3 md:gap-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative rounded-lg bg-page p-3 ring-1 ring-inset ring-line md:p-5"
        >
          <div className="mb-3 flex items-center justify-between text-xs text-muted md:text-sm">
            <span className="font-medium text-fg-2">Your binder</span>
          </div>
          {page(MINE, "mine")}
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="relative mt-10 rounded-lg bg-page p-3 ring-1 ring-inset ring-line md:p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-xs md:text-sm">
            <Avatar seed={aiman.id} size={22} />
            <span className="font-medium text-fg-2">Aiman&apos;s binder</span>
          </div>
          {page(THEIRS, "theirs")}
        </motion.div>
      </div>

      {/* Threads */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {paths.map((p, i) => (
          <motion.path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="var(--color-pear)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={i === 1 ? "5 6" : undefined}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: i === 0 ? 0.9 : 0.6 }}
            transition={{ delay: 0.7 + i * 0.25, duration: 0.7, ease }}
            style={{ filter: "drop-shadow(0 0 6px rgb(212 242 106 / 0.45))" }}
          />
        ))}
      </svg>

      {/* Pocket peeks over your page, watching the thread */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease }}
        className="absolute left-[29%] top-[-6px] w-16 md:left-[30%] md:top-[-18px] md:w-24"
      >
        <Pocket expression="curious" size={96} className="h-auto w-full" />
      </motion.div>

      {/* Floating glass match panel */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.35, duration: 0.5, ease }}
        className={cx(
          "glass absolute bottom-0 left-1/2 flex w-[min(92%,440px)] -translate-x-1/2 items-center gap-3 rounded-xl p-3 md:gap-4 md:p-4",
        )}
      >
        <div className="shrink-0 rounded-2xl bg-night px-3 py-2 text-center ring-1 ring-inset ring-pear/30">
          <div className="font-display text-2xl font-bold leading-none tracking-tight text-pear md:text-3xl">96%</div>
          <div className="mt-1 text-[9px] font-semibold tracking-[0.18em] text-pear/80">MATCH</div>
        </div>
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium text-fg">{aiman.name}</div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted md:text-[13px]">
            <span className="inline-flex items-center gap-1 text-seal">
              <SealCheck size={13} weight="fill" aria-hidden /> Identity Verified
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} aria-hidden /> {aiman.location}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
