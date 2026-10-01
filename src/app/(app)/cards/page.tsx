"use client";

import { useEffect, useRef, useState } from "react";
import { Books, Check, Heart, MagnifyingGlass, X } from "@phosphor-icons/react";
import { PocketSlot } from "@/components/Card";
import { Pocket } from "@/components/Pocket";
import { Pills } from "@/components/Pills";
import { buttonClass, cx, fieldClass } from "@/components/ui";
import {
  type CardFilters as Filters,
  type FilterOptions,
  type IgnoreKey,
  type SearchInterpretation,
} from "@/lib/card-filters";
import { addToCollection } from "../collection/actions";
import { addToWants } from "../wants/actions";
import { CardFilters } from "./CardFilters";
import { SearchHints } from "./SearchHints";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
  language?: string | null;
};

type AddKind = "collection" | "wants";
type CardLang = "en" | "ja";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

function hasActiveFilters(filters: Filters) {
  return Object.values(filters).some(Boolean);
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

export default function CardsPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [ignore, setIgnore] = useState<IgnoreKey[]>([]);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [mode, setMode] = useState<"popular" | "search">("popular");
  const [cards, setCards] = useState<Card[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [interpretation, setInterpretation] =
    useState<SearchInterpretation | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Record<string, Set<string>>>({
    collection: new Set(),
    wants: new Set(),
  });
  const [pending, setPending] = useState<{ id: string; kind: AddKind } | null>(
    null,
  );

  // How many other collectors hold each card for trade, filled in after each
  // result set loads so the search itself never waits on it.
  const [holders, setHolders] = useState<Record<string, number>>({});

  // Which printing to browse. Read through a ref inside the fetch helpers so
  // a debounced search always uses the language picked most recently.
  const [lang, setLang] = useState<CardLang>("en");
  const langRef = useRef<CardLang>("en");

  const inflight = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only the newest request may update the page: typing quickly or changing a
  // filter cancels whatever is still in flight.
  function startRequest() {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    return controller.signal;
  }

  async function loadPopular() {
    const signal = startRequest();
    setMode("popular");
    setInterpretation(null);
    setHasMore(false);
    setLoadingMore(false);
    setStatus("loading");

    try {
      const res = await fetch(`/api/cards/popular?lang=${langRef.current}`, { signal });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Could not load popular cards");
        setStatus("error");
        return;
      }

      setCards(json.cards);
      setStatus("idle");
    } catch (err) {
      if (isAbort(err)) return;
      setError("Could not load popular cards");
      setStatus("error");
    }
  }

  useEffect(() => {
    // Standard fetch-on-mount: loadPopular is also reused from runSearch()
    // when the query is cleared, which is the intentional reason it isn't
    // inlined here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPopular();

    fetch("/api/cards/filters")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: FilterOptions | null) => {
        if (json) setOptions(json);
      })
      .catch(() => {
        // Search still works without the filter bar.
      });
  }, []);

  async function runSearch(
    q: string,
    activeFilters: Filters,
    activeIgnore: IgnoreKey[],
    pageNumber = 1,
  ) {
    const text = q.trim();
    if (text.length < MIN_QUERY_LENGTH && !hasActiveFilters(activeFilters)) {
      await loadPopular();
      return;
    }

    const signal = startRequest();
    setMode("search");
    setStatus("loading");
    setLoadingMore(pageNumber > 1);

    const params = new URLSearchParams();
    if (text.length >= MIN_QUERY_LENGTH) params.set("q", text);
    if (langRef.current !== "en") params.set("lang", langRef.current);
    if (activeFilters.setId) params.set("set", activeFilters.setId);
    if (activeFilters.rarity) params.set("rarity", activeFilters.rarity);
    if (activeFilters.type) params.set("type", activeFilters.type);
    if (activeFilters.category) params.set("category", activeFilters.category);
    if (activeFilters.finish) params.set("finish", activeFilters.finish);
    if (activeIgnore.length) params.set("ignore", activeIgnore.join(","));
    if (pageNumber > 1) params.set("page", String(pageNumber));

    try {
      const res = await fetch(`/api/cards/search?${params}`, { signal });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Search failed");
        setStatus("error");
        return;
      }

      setCards((prev) => {
        if (pageNumber === 1) return json.cards;
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...json.cards.filter((c: Card) => !seen.has(c.id))];
      });
      setPage(pageNumber);
      setHasMore(json.hasMore);
      setInterpretation(json.interpretation);
      setStatus("idle");
    } catch (err) {
      if (isAbort(err)) return;
      setError("Search failed");
      setStatus("error");
    } finally {
      if (!signal.aborted) setLoadingMore(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    // Interpretation switches only apply to the text they were made on.
    setIgnore([]);

    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => runSearch(value, filters, []),
      DEBOUNCE_MS,
    );
  }

  function handleLangChange(next: CardLang) {
    if (next === langRef.current) return;
    if (debounce.current) clearTimeout(debounce.current);
    langRef.current = next;
    setLang(next);
    // Set, rarity and type filters only exist for the English catalogue.
    setFilters({});
    setIgnore([]);
    setCards([]);
    runSearch(query, {}, []);
  }

  function handleFiltersChange(next: Filters) {
    if (debounce.current) clearTimeout(debounce.current);
    setFilters(next);
    runSearch(query, next, ignore);
  }

  function updateIgnore(next: IgnoreKey[]) {
    setIgnore(next);
    runSearch(query, filters, next);
  }

  function toggleIgnore(key: IgnoreKey) {
    updateIgnore(
      ignore.includes(key) ? ignore.filter((k) => k !== key) : [...ignore, key],
    );
  }

  async function handleAdd(cardId: string, kind: AddKind) {
    setPending({ id: cardId, kind });
    const result =
      kind === "collection"
        ? await addToCollection(cardId)
        : await addToWants(cardId);
    setPending(null);

    if (!result.error) {
      setAdded((prev) => ({
        ...prev,
        [kind]: new Set(prev[kind]).add(cardId),
      }));
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  useEffect(() => {
    const missing = cards.map((c) => c.id).filter((id) => !(id in holders));
    if (missing.length === 0) return;
    const controller = new AbortController();
    fetch(`/api/cards/holders?ids=${encodeURIComponent(missing.join(","))}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { counts: Record<string, number> } | null) => {
        if (!json) return;
        setHolders((prev) => {
          const next = { ...prev };
          for (const id of missing) next[id] = json.counts[id] ?? 0;
          return next;
        });
      })
      .catch(() => {
        // Counts are a nice-to-have; cards still show without them.
      });
    return () => controller.abort();
    // Only re-run when the result set changes, not when counts arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const showEmpty = status === "idle" && mode === "search" && cards.length === 0;

  return (
    <div>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Discover</h1>
        <p className="mt-2 text-muted">
          Search English and Japanese Pokémon cards and drop them into your binder or your wants.
        </p>
      </header>

      <div className="mt-8">
        <label htmlFor="card-search" className="mb-2 block text-sm font-medium text-fg-2">
          Search cards
        </label>
        <div className="relative max-w-[640px]">
          <MagnifyingGlass
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id="card-search"
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={lang === "ja" ? 'Try "umbreon", "ブラッキー" or "charizard 201"' : 'Try "pikachu 30" or "salamence ex delta"'}
            autoComplete="off"
            className={fieldClass(false, "h-13 pl-12 pr-12 text-base")}
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-fg"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>

        <div className="mt-4">
          <Pills
            label="Card language"
            value={lang}
            onChange={handleLangChange}
            options={[
              { value: "en", label: "English" },
              { value: "ja", label: "Japanese" },
            ]}
          />
        </div>

        {lang === "ja" && (
          <p className="mt-3 text-sm text-muted">
            Search Japanese cards by Pokémon name in English or Japanese. Trainer cards need their Japanese name.
          </p>
        )}

        {options && lang === "en" && (
          <div className="mt-4">
            <CardFilters options={options} filters={filters} onChange={handleFiltersChange} />
          </div>
        )}
      </div>

      {mode === "search" && interpretation && lang === "en" && (
        <div className="mt-5">
          <SearchHints
            query={query}
            interpretation={interpretation}
            ignore={ignore}
            onToggle={toggleIgnore}
            onReset={() => updateIgnore([])}
          />
        </div>
      )}

      <section aria-label="Cards" className="mt-8">
        <div aria-live="polite">
          {mode === "popular" && status !== "error" && (
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Popular {lang === "ja" ? "Japanese " : ""}cards
            </h2>
          )}
          {status === "loading" && !loadingMore && (
            <p className="mt-2 flex items-center gap-3 text-sm text-muted">
              <Pocket expression="searching" size={36} className="shrink-0" />
              {mode === "popular" ? "Loading…" : "Searching…"}
            </p>
          )}
          {status === "error" && <p className="text-sm text-danger">{error}</p>}
          {showEmpty && (
            <p className="rounded-lg bg-page p-6 text-center text-muted ring-1 ring-inset ring-line">
              {query.trim()
                ? `No cards found for "${query.trim()}".`
                : "No cards match these filters."}{" "}
              {hasActiveFilters(filters)
                ? "Try removing a filter."
                : "Try a different name or spelling."}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cards.map((card) => {
            const inCollection = added.collection.has(card.id);
            const inWants = added.wants.has(card.id);
            const adding = (kind: AddKind) => pending?.id === card.id && pending.kind === kind;
            return (
              <div key={card.id} className="min-w-0">
                <PocketSlot card={card} tab={inCollection ? "Mine" : undefined} />
                <div className="mt-3 px-0.5">
                  <div className="truncate text-sm font-medium text-fg">{card.name}</div>
                  <div className="truncate text-xs text-muted">
                    {card.set_name}, #{card.card_number}
                  </div>
                  {card.id in holders && (
                    <div className={cx("mt-1 text-xs font-medium", holders[card.id] > 0 ? "text-fg-2" : "text-muted")}>
                      {holders[card.id] > 0
                        ? `${holders[card.id]} collector${holders[card.id] === 1 ? " has" : "s have"} it`
                        : "Nobody has it yet"}
                    </div>
                  )}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={adding("collection") || inCollection}
                    onClick={() => handleAdd(card.id, "collection")}
                    aria-label={`Add ${card.name} to collection`}
                    className={cx(
                      "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition",
                      inCollection
                        ? "bg-pear/15 text-pear"
                        : "bg-pear text-pear-ink hover:bg-pear-2 disabled:opacity-45",
                    )}
                  >
                    {inCollection ? <Check size={14} weight="bold" aria-hidden /> : <Books size={14} weight="bold" aria-hidden />}
                    {inCollection ? "In binder" : adding("collection") ? "Adding…" : "Have"}
                  </button>
                  <button
                    type="button"
                    disabled={adding("wants") || inWants}
                    onClick={() => handleAdd(card.id, "wants")}
                    aria-label={`Add ${card.name} to wants`}
                    className={cx(
                      "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition",
                      inWants
                        ? "bg-pear/15 text-pear"
                        : "bg-page-2 text-fg ring-1 ring-inset ring-line-2 hover:bg-page-3 disabled:opacity-45",
                    )}
                  >
                    <Heart size={14} weight={inWants ? "fill" : "regular"} aria-hidden />
                    {inWants ? "Wanted" : adding("wants") ? "Adding…" : "Want"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {mode === "search" && hasMore && status !== "error" && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => runSearch(query, filters, ignore, page + 1)}
              className={buttonClass("secondary")}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
