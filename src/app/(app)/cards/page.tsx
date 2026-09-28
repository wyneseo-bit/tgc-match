"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TcgCard } from "@/components/TcgCard";
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
};

type AddKind = "collection" | "wants";

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
      const res = await fetch("/api/cards/popular", { signal });
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

  const showEmpty = status === "idle" && mode === "search" && cards.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold tracking-tight">Discover</h1>
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          Search the Pokémon TCG catalog to build your collection and wants.
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className="flex h-12 max-w-[560px] items-center gap-2.5 rounded-btn px-3.5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
        >
          <Search size={17} strokeWidth={2} color="var(--color-muted)" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder='Try "pikachu 30" or "salamence ex delta"'
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>

        {options && (
          <CardFilters
            options={options}
            filters={filters}
            onChange={handleFiltersChange}
          />
        )}
      </div>

      {mode === "search" && interpretation && (
        <SearchHints
          query={query}
          interpretation={interpretation}
          ignore={ignore}
          onToggle={toggleIgnore}
          onReset={() => updateIgnore([])}
        />
      )}

      {mode === "popular" && status !== "error" && (
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          Popular cards
        </h2>
      )}

      {status === "loading" && !loadingMore && (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          {mode === "popular" ? "Loading…" : "Searching…"}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
      )}

      {showEmpty && (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          {query.trim()
            ? `No cards found for "${query.trim()}".`
            : "No cards match these filters."}{" "}
          {hasActiveFilters(filters)
            ? "Try removing a filter."
            : "Try a different name or spelling."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col items-center gap-2 text-center">
            <TcgCard width={140} imageUrl={card.image_url} alt={card.name} />
            <div>
              <p className="text-sm font-semibold">{card.name}</p>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {card.set_name} · #{card.card_number}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={
                  (pending?.id === card.id && pending.kind === "collection") ||
                  added.collection.has(card.id)
                }
                onClick={() => handleAdd(card.id, "collection")}
                className="gradient-primary rounded-btn px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {added.collection.has(card.id)
                  ? "In collection"
                  : pending?.id === card.id && pending.kind === "collection"
                    ? "Adding…"
                    : "+ Collection"}
              </button>
              <button
                type="button"
                disabled={
                  (pending?.id === card.id && pending.kind === "wants") ||
                  added.wants.has(card.id)
                }
                onClick={() => handleAdd(card.id, "wants")}
                className="rounded-btn border border-border-strong px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                style={{ background: "var(--color-surface-2)" }}
              >
                {added.wants.has(card.id)
                  ? "In wants"
                  : pending?.id === card.id && pending.kind === "wants"
                    ? "Adding…"
                    : "+ Wants"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {mode === "search" && hasMore && status !== "error" && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => runSearch(query, filters, ignore, page + 1)}
          className="self-center rounded-btn border border-border-strong px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--color-surface-2)" }}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
