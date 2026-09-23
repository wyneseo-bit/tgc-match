"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

  async function search(q: string) {
    setQuery(q);

    if (q.trim().length < 2) {
      setCards([]);
      setStatus("idle");
      return;
    }

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
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Card search</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/collection" className="underline">
            My Collection
          </Link>
          <Link href="/wants" className="underline">
            My Wants
          </Link>
        </div>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search for a card, e.g. Pikachu"
        className="w-full rounded border px-3 py-2"
      />

      {status === "loading" && (
        <p className="mt-4 text-sm text-zinc-500">Searching…</p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col items-center text-center">
            {card.image_url && (
              <Image
                src={card.image_url}
                alt={card.name}
                width={150}
                height={210}
                unoptimized
              />
            )}
            <p className="mt-1 text-sm font-medium">{card.name}</p>
            <p className="text-xs text-zinc-500">
              {card.set_name} · #{card.card_number}
            </p>
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                disabled={
                  (pending?.id === card.id && pending.kind === "collection") ||
                  added.collection.has(card.id)
                }
                onClick={() => handleAdd(card.id, "collection")}
                className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
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
                className="rounded border border-black px-2 py-1 text-xs disabled:opacity-50"
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
    </main>
  );
}
