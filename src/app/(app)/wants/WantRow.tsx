"use client";

import { useState, useTransition } from "react";
import { TcgCard } from "@/components/TcgCard";
import { removeFromWants, updatePriority } from "./actions";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

export type WantItem = {
  id: string;
  priority: "low" | "medium" | "high";
  card: Card;
};

export function WantRow({ item }: { item: WantItem }) {
  const [priority, setPriority] = useState(item.priority);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (removed) return null;

  return (
    <div
      className="glass flex flex-col gap-3 rounded-card p-4 sm:flex-row sm:items-center sm:gap-4"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <TcgCard width={56} imageUrl={item.card.image_url} alt={item.card.name} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.card.name}</p>
          <p className="truncate text-xs" style={{ color: "var(--color-muted)" }}>
            {item.card.set_name} · #{item.card.card_number}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:flex-none">
        <select
          value={priority}
          onChange={(e) => {
            const value = e.target.value as WantItem["priority"];
            setPriority(value);
            startTransition(() => {
              updatePriority(item.id, value);
            });
          }}
          className="rounded-btn border border-border-strong px-2.5 py-1.5 text-sm text-text"
          style={{ background: "var(--color-surface-2)" }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setRemoved(true);
            startTransition(() => {
              removeFromWants(item.id);
            });
          }}
          className="text-sm underline disabled:opacity-50"
          style={{ color: "var(--color-danger)" }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
