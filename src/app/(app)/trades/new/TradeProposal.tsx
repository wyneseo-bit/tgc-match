"use client";

import { useState, useTransition } from "react";
import { ArrowsLeftRight, Check, MapPin } from "@phosphor-icons/react";
import { PocketSlot, type CardFace } from "@/components/Card";
import { Button, cx, fieldClass } from "@/components/ui";
import { proposeTrade } from "../actions";

export type ProposalCard = { id: string; card: CardFace; details: string | null };

function Side({
  title,
  cards,
  selected,
  onToggle,
}: {
  title: string;
  cards: ProposalCard[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg-2">
        {title} <span className="text-muted">({selected.size} of {cards.length})</span>
      </legend>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c.id)}
              className={cx("relative min-w-0 rounded-md text-left transition", !on && "opacity-45 hover:opacity-80")}
            >
              <PocketSlot card={c.card} highlight={on} />
              <span className="mt-2 block truncate text-xs font-medium text-fg">{c.card.name}</span>
              {c.details && <span className="block truncate text-[11px] text-muted">{c.details}</span>}
              {on && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-pear text-pear-ink shadow">
                  <Check size={14} weight="bold" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TradeProposal({
  matchId,
  theirName,
  give,
  get,
  defaultPlace,
}: {
  matchId: string;
  theirName: string;
  give: ProposalCard[];
  get: ProposalCard[];
  defaultPlace: string;
}) {
  const [giveSel, setGiveSel] = useState(() => new Set(give.map((c) => c.id)));
  const [getSel, setGetSel] = useState(() => new Set(get.map((c) => c.id)));
  const [place, setPlace] = useState(defaultPlace);
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) =>
    set((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canSubmit = giveSel.size > 0 && getSel.size > 0 && place.trim().length > 0 && reviewed;

  const submit = () =>
    start(async () => {
      setError(null);
      // datetime-local has no timezone; convert from the proposer's local time here.
      const meetupAt = when ? new Date(when).toISOString() : null;
      const result = await proposeTrade({
        matchId,
        give: [...giveSel],
        get: [...getSel],
        meetupPlace: place,
        meetupAt,
        note,
      });
      // On success the action redirects to the new trade.
      if (result?.error) setError(result.error);
    });

  const giveNames = give.filter((c) => giveSel.has(c.id)).map((c) => c.card.name);
  const getNames = get.filter((c) => getSel.has(c.id)).map((c) => c.card.name);

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-page p-5 ring-1 ring-inset ring-line md:p-7">
        <h2 className="font-display text-xl font-semibold tracking-tight">Cards</h2>
        <p className="mt-1 text-sm text-muted">Everything in your match is picked. Tap a card to leave it out.</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <Side title="You give" cards={give} selected={giveSel} onToggle={toggle(setGiveSel)} />
          <Side title={`${theirName} gives`} cards={get} selected={getSel} onToggle={toggle(setGetSel)} />
        </div>
      </section>

      <section className="rounded-lg bg-page p-5 ring-1 ring-inset ring-line md:p-7">
        <h2 className="font-display text-xl font-semibold tracking-tight">Meetup</h2>
        <p className="mt-1 text-sm text-muted">Trades happen in person for now. Pick a busy public place.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="place" className="text-sm font-medium text-fg-2">
              Where
            </label>
            <div className="relative">
              <MapPin size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Mid Valley Megamall, food court"
                className={fieldClass(false, "pl-11")}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label htmlFor="when" className="text-sm font-medium text-fg-2">
              When <span className="text-muted">(optional)</span>
            </label>
            <input
              id="when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={fieldClass(false, "[color-scheme:dark]")}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="note" className="text-sm font-medium text-fg-2">
              Note to {theirName} <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Anything they should know, like how to find you."
              className={fieldClass(false, "h-auto py-3")}
            />
          </div>
        </div>
      </section>

      <section className="glass sticky bottom-24 z-20 rounded-xl p-4 md:p-5 lg:bottom-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex items-center gap-2 font-medium text-fg">
              <span className="truncate">{giveNames.join(" + ") || "—"}</span>
              <ArrowsLeftRight size={16} weight="bold" className="shrink-0 text-pear" aria-label="for" />
              <span className="truncate">{getNames.join(" + ") || "—"}</span>
            </div>
            <label className="mt-2 flex items-start gap-2.5 text-fg-2">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="mt-0.5 size-[18px] shrink-0 rounded accent-pear"
              />
              I&apos;ve checked the cards and conditions, and I&apos;ll bring my cards to the meetup.
            </label>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 lg:items-end">
            <Button size="lg" disabled={!canSubmit || pending} onClick={submit}>
              {pending ? "Sending…" : `Send proposal to ${theirName}`}
            </Button>
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
