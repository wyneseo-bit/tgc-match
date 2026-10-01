"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import { TcgCard } from "./Card";
import { Pills } from "./Pills";
import { Pocket } from "./Pocket";
import { cx, fieldClass } from "./ui";

export type PickerCard = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
  language?: string | null;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Search-first card picker over the real catalogue. Shows popular cards until
 * you type; tapping a card drops it into (or out of) the selection.
 */
export function CardPicker({
  id = "card-search",
  selected,
  onToggle,
  exclude = [],
}: {
  id?: string;
  selected: Record<string, PickerCard>;
  onToggle: (card: PickerCard) => void;
  exclude?: string[];
}) {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<PickerCard[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<AbortController | null>(null);
  const [lang, setLang] = useState<"en" | "ja">("en");
  const langRef = useRef<"en" | "ja">("en");

  function load(text: string) {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    setStatus("loading");
    const url =
      text.trim().length >= MIN_QUERY_LENGTH
        ? `/api/cards/search?q=${encodeURIComponent(text.trim())}&lang=${langRef.current}`
        : `/api/cards/popular?lang=${langRef.current}`;
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Search failed");
        setCards(json.cards);
        setStatus("idle");
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
      });
  }

  useEffect(() => {
    // Fetch-on-mount; load() is reused for every search after that.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load("");
    return () => inflight.current?.abort();
  }, []);

  function onChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(value), DEBOUNCE_MS);
  }

  const shown = cards.filter((c) => !exclude.includes(c.id));
  const picked = Object.values(selected);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-fg-2">
        Search cards
      </label>
      <div className="relative">
        <MagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Card name, set or number, e.g. "charizard 4"'
          autoComplete="off"
          className={fieldClass(false, "pl-12")}
        />
      </div>

      <div className="mt-3">
        <Pills
          label="Card language"
          value={lang}
          onChange={(next) => {
            langRef.current = next;
            setLang(next);
            load(query);
          }}
          options={[
            { value: "en", label: "English" },
            { value: "ja", label: "Japanese" },
          ]}
        />
      </div>

      {picked.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Selected cards">
          {picked.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-pear/12 pl-3 pr-2 text-xs font-medium text-pear ring-1 ring-inset ring-pear/30 hover:bg-pear/20"
              aria-label={`Remove ${c.name}`}
            >
              {c.name}
              <X size={12} weight="bold" aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" className="mt-5">
        {status === "loading" && (
          <p className="flex items-center gap-3 text-sm text-muted">
            <Pocket expression="searching" size={32} className="shrink-0" /> Searching…
          </p>
        )}
        {status === "error" && <p className="text-sm text-danger">Couldn&apos;t load cards. Try again.</p>}
        {status === "idle" && shown.length === 0 && (
          <p className="text-sm text-muted">No cards found for &quot;{query.trim()}&quot;.</p>
        )}
        {status === "idle" && !query.trim() && shown.length > 0 && (
          <p className="text-sm text-muted">Popular cards. Search to find yours.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {shown.map((c) => {
          const on = !!selected[c.id];
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(c)}
              className={cx(
                "pocket group relative rounded-md p-[7%] text-left transition",
                on && "shadow-[inset_0_0_0_2px_var(--color-pear)]",
              )}
            >
              <div className={cx("transition duration-200", !on && "group-hover:-translate-y-0.5")}>
                <TcgCard card={c} />
              </div>
              <span className="mt-2 block truncate text-xs font-medium text-fg-2">{c.name}</span>
              <span className="block truncate text-[11px] text-muted">
                {c.set_name}, #{c.card_number}
              </span>
              {on && (
                <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-pear text-pear-ink shadow">
                  <Check size={14} weight="bold" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
