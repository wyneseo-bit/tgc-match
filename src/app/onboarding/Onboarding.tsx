"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { TcgCard } from "@/components/Card";
import { CardPicker, type PickerCard } from "@/components/CardPicker";
import { Logo } from "@/components/Logo";
import { Pocket, type Expression, type Prop } from "@/components/Pocket";
import { Button, ButtonLink, buttonClass, cx } from "@/components/ui";
import { demo } from "@/lib/demo";
import { completeOnboarding } from "./actions";

const STEPS: { title: string; line: string; expression: Expression; prop: Prop }[] = [
  { title: "Which games do you collect?", line: "Let's see what your collection can unlock.", expression: "curious", prop: "binder" },
  { title: "Add a few cards you have.", line: "Start with the ones you'd trade. The rest can wait.", expression: "thinking", prop: "none" },
  { title: "What are you hunting for?", line: "Empty pockets are what I look for.", expression: "searching", prop: "none" },
  { title: "Your binder is ready.", line: "I'll keep looking while you're away.", expression: "excited", prop: "card" },
];

const SOON = ["One Piece", "Magic", "Yu-Gi-Oh!"];

type Result = { error: string | null; matchCount: number; firstMatchId: string | null };

export function Onboarding({ displayName }: { displayName: string }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [pokemon, setPokemon] = useState(true);
  const [have, setHave] = useState<Record<string, PickerCard>>({});
  const [want, setWant] = useState<Record<string, PickerCard>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [saving, startSaving] = useTransition();

  const toggle = (set: React.Dispatch<React.SetStateAction<Record<string, PickerCard>>>) => (card: PickerCard) =>
    set((s) => {
      const next = { ...s };
      if (next[card.id]) delete next[card.id];
      else next[card.id] = card;
      return next;
    });

  const haveCount = Object.keys(have).length;
  const wantCount = Object.keys(want).length;
  const canContinue = [pokemon, haveCount > 0, wantCount > 0, true][step];

  const finish = () =>
    startSaving(async () => {
      const r = await completeOnboarding(Object.keys(have), Object.keys(want));
      setResult(r);
      if (!r.error) setStep(3);
    });

  const s = STEPS[step];
  const mascot = saving
    ? { expression: "searching" as Expression, prop: "none" as Prop, line: "Finding collectors who match..." }
    : step === 3 && result && result.matchCount === 0
      ? { expression: "thinking" as Expression, prop: "none" as Prop, line: "Nobody fits yet. I'll keep watching." }
      : step === 0
        ? { ...s, line: `Hi ${displayName}! ${s.line}` }
        : s;

  return (
    <div className="room min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Logo href="/matches" />
        {step < 3 && (
          <Link href="/matches" className="text-sm text-muted hover:text-fg">
            Skip for now
          </Link>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-4 md:px-8 lg:grid-cols-[280px_1fr] lg:gap-14 lg:pt-10">
        {/* Pocket accompanies every step */}
        <aside className="flex items-end gap-4 lg:sticky lg:top-10 lg:flex-col lg:items-start lg:self-start">
          <Pocket expression={mascot.expression} prop={mascot.prop} size={120} className="shrink-0 lg:h-auto lg:w-[180px]" />
          <AnimatePresence mode="wait">
            <motion.p
              key={mascot.line}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative mb-6 rounded-2xl rounded-bl-sm bg-page-2 px-4 py-3 text-[15px] text-fg ring-1 ring-inset ring-line-2 lg:mb-0 lg:rounded-bl-2xl lg:rounded-tl-sm"
            >
              {mascot.line}
            </motion.p>
          </AnimatePresence>
        </aside>

        <main>
          <ol className="flex gap-2" aria-label={`Step ${step + 1} of 4`}>
            {STEPS.map((_, i) => (
              <li key={i} className={cx("h-1.5 w-10 rounded-full transition-colors", i <= step ? "bg-pear" : "bg-page-3")} />
            ))}
          </ol>

          {saving ? (
            <div role="status" className="mt-8">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Finding collectors who match...</h1>
              <p className="mt-2 text-muted">Saving your binder and checking the network.</p>
              <div className="mt-8 grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="pocket-empty aspect-[63/88] animate-pulse" />
                <span className="size-10 rounded-full bg-page-2" />
                <div className="pocket-empty aspect-[63/88] animate-pulse" />
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={reduce ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8"
              >
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  {step === 3 && result && result.matchCount > 0
                    ? `We found ${result.matchCount} potential trade${result.matchCount === 1 ? "" : "s"}.`
                    : s.title}
                </h1>

                {step === 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    <button
                      type="button"
                      aria-pressed={pokemon}
                      onClick={() => setPokemon((p) => !p)}
                      className={cx("pocket relative p-3 text-left transition", pokemon && "shadow-[inset_0_0_0_2px_var(--color-pear)]")}
                    >
                      <TcgCard card={demo("umbreon")} />
                      <span className="mt-3 block font-medium">Pokémon</span>
                      {pokemon && (
                        <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-pear text-pear-ink">
                          <Check size={15} weight="bold" aria-hidden />
                        </span>
                      )}
                    </button>
                    <div className="pocket-empty flex flex-col justify-end p-4">
                      <span className="font-medium">{SOON.join(", ")}</span>
                      <span className="mt-1 text-sm text-muted">Coming soon. We&apos;ll let you know.</span>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="mt-8">
                    <CardPicker id="have-search" selected={have} onToggle={toggle(setHave)} />
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-8">
                    <CardPicker id="want-search" selected={want} onToggle={toggle(setWant)} exclude={Object.keys(have)} />
                  </div>
                )}

                {step === 3 && result && (
                  <div className="mt-6 max-w-xl">
                    <p className="text-muted">
                      {result.matchCount > 0
                        ? "Collectors on the network have what you want, and want what you have."
                        : `We added ${haveCount} card${haveCount === 1 ? "" : "s"} to your binder and ${wantCount} want${wantCount === 1 ? "" : "s"}. Matches appear as soon as someone fits.`}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      {result.firstMatchId ? (
                        <ButtonLink href={`/matches/${result.firstMatchId}`} size="lg">
                          See your best match
                        </ButtonLink>
                      ) : (
                        <ButtonLink href="/cards" size="lg">
                          Add more cards
                        </ButtonLink>
                      )}
                      <Link href="/collection" className={buttonClass("secondary", "lg")}>
                        Open my binder
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {!saving && step < 3 && (
            <div className="glass sticky bottom-4 z-10 mt-10 flex items-center justify-between gap-3 rounded-xl p-3">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((x) => x - 1)}>
                  <ArrowLeft size={16} aria-hidden /> Back
                </Button>
              ) : (
                <span className="pl-3 text-sm text-muted">Pick one or more.</span>
              )}
              <span aria-live="polite" className="text-sm text-danger">
                {result?.error}
              </span>
              <Button onClick={step === 2 ? finish : () => setStep((x) => x + 1)} disabled={!canContinue}>
                {step === 2 ? "Find matches" : "Continue"}
                {step === 1 && haveCount > 0 && <span className="tabular-nums">({haveCount})</span>}
                {step === 2 && wantCount > 0 && <span className="tabular-nums">({wantCount})</span>}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
