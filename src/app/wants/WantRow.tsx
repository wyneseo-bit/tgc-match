"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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

      <select
        value={priority}
        onChange={(e) => {
          const value = e.target.value as WantItem["priority"];
          setPriority(value);
          startTransition(() => {
            updatePriority(item.id, value);
          });
        }}
        className="rounded border px-2 py-1 text-sm"
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
        className="text-sm text-red-600 underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
