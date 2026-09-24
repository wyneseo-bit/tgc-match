"use client";

import { useState, useTransition } from "react";
import { TcgCard } from "@/components/TcgCard";
import {
  removeFromCollection,
  updateQuantity,
  updateTradeStatus,
} from "./actions";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

export type CollectionItem = {
  id: string;
  quantity: number;
  trade_status: "keep" | "maybe" | "available" | "for_sale";
  card: Card;
};

const inputClass =
  "rounded-btn border border-border-strong px-2.5 py-1.5 text-sm text-text";

export function CollectionRow({ item }: { item: CollectionItem }) {
  const [tradeStatus, setTradeStatus] = useState(item.trade_status);
  const [quantity, setQuantity] = useState(item.quantity);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (removed) return null;

  return (
    <div
      className="glass flex items-center gap-4 rounded-card p-4"
      style={{ border: "1px solid var(--color-border)" }}
    >
      <TcgCard width={56} imageUrl={item.card.image_url} alt={item.card.name} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.card.name}</p>
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
          {item.card.set_name} · #{item.card.card_number}
        </p>
      </div>

      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => {
          const value = Math.max(1, Number(e.target.value) || 1);
          setQuantity(value);
          startTransition(() => {
            updateQuantity(item.id, value);
          });
        }}
        className={`w-16 ${inputClass}`}
        style={{ background: "var(--color-surface-2)" }}
      />

      <select
        value={tradeStatus}
        onChange={(e) => {
          const value = e.target.value as CollectionItem["trade_status"];
          setTradeStatus(value);
          startTransition(() => {
            updateTradeStatus(item.id, value);
          });
        }}
        className={inputClass}
        style={{ background: "var(--color-surface-2)" }}
      >
        <option value="keep">Keep</option>
        <option value="maybe">Maybe</option>
        <option value="available">Available</option>
        <option value="for_sale">For sale</option>
      </select>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setRemoved(true);
          startTransition(() => {
            removeFromCollection(item.id);
          });
        }}
        className="text-sm underline disabled:opacity-50"
        style={{ color: "var(--color-danger)" }}
      >
        Remove
      </button>
    </div>
  );
}
