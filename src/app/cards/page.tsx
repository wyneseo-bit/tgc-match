"use client";

import { useState } from "react";
import Image from "next/image";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

export default function CardsPage() {
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-4 text-2xl font-semibold">Card search</h1>

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
          </div>
        ))}
      </div>
    </main>
  );
}
