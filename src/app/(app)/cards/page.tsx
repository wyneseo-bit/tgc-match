"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { TcgCard } from "@/components/TcgCard";
import { addToCollection } from "../collection/actions";
import { addToWants } from "../wants/actions";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

type AddKind = "collection" | "wants";

export default function CardsPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"popular" | "search">("popular");
  const [cards, setCards] = useState<Card[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Record<string, Set<string>>>({
    collection: new Set(),
    wants: new Set(),
  });
  const [pending, setPending] = useState<{ id: string; kind: AddKind } | null>(
    null,
  );

  async function loadPopular() {
    setMode("popular");
    setStatus("loading");
    const res = await fetch("/api/cards/popular");
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Could not load popular cards");
      setStatus("error");
      return;
    }

    setCards(json.cards);
    setStatus("idle");
  }

  useEffect(() => {
    // Standard fetch-on-mount: loadPopular is also reused from search()
    // when the query is cleared, which is the intentional reason it isn't
    // inlined here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPopular();
  }, []);

  async function search(q: string) {
    setQuery(q);

    if (q.trim().length < 2) {
      await loadPopular();
      return;
    }

    setMode("search");
    setStatus("loading");
    const res = await fetch(`/api/cards/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Search failed");
      setStatus("error");
      return;
    }

    setCards(json.cards);
    setStatus("idle");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold tracking-tight">Discover</h1>
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          Search the Pokémon TCG catalog to build your collection and wants.
        </span>
      </div>

      <div
        className="flex h-12 max-w-[420px] items-center gap-2.5 rounded-btn px-3.5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
      >
        <Search size={17} strokeWidth={2} color="var(--color-muted)" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search for a card, e.g. Pikachu"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
      </div>

      {mode === "popular" && status !== "error" && (
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
          Popular cards
        </h2>
      )}

      {status === "loading" && (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          {mode === "popular" ? "Loading…" : "Searching…"}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
      )}

      {status === "idle" && mode === "search" && cards.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          No cards found for &quot;{query}&quot;. Try a different name or spelling.
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
    </div>
  );
}
