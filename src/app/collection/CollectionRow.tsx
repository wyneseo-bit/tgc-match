"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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

export function CollectionRow({ item }: { item: CollectionItem }) {
  const [tradeStatus, setTradeStatus] = useState(item.trade_status);
  const [quantity, setQuantity] = useState(item.quantity);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (removed) return null;

  return (
    <div className="flex items-center gap-4 py-3">
      {item.card.image_url && (
        <Image
          src={item.card.image_url}
          alt={item.card.name}
          width={50}
          height={70}
          unoptimized
        />
      )}

      <div className="flex-1">
        <p className="font-medium">{item.card.name}</p>
        <p className="text-xs text-zinc-500">
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
        className="w-16 rounded border px-2 py-1 text-sm"
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
        className="rounded border px-2 py-1 text-sm"
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
        className="text-sm text-red-600 underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
