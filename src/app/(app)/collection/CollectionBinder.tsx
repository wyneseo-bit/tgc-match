"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { AddPocket, PocketSlot } from "@/components/Card";
import { Binder, fillPage } from "@/components/Binder";
import { Pills } from "@/components/Pills";
import { cx, selectClass } from "@/components/ui";
import { CONDITION_OPTIONS, type Condition } from "@/lib/card-condition";
import {
  removeFromCollection,
  updateCondition,
  updateQuantity,
  updateTradeStatus,
} from "./actions";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
  language?: string | null;
};

type TradeStatus = "keep" | "maybe" | "available" | "for_sale";

export type CollectionItem = {
  id: string;
  quantity: number;
  trade_status: TradeStatus;
  condition: Condition;
  card: Card;
};

const STATUS: { value: TradeStatus; label: string; tab?: string }[] = [
  { value: "available", label: "For trade", tab: "Trade" },
  { value: "maybe", label: "Maybe", tab: "Maybe" },
  { value: "for_sale", label: "For sale", tab: "Sale" },
  { value: "keep", label: "Keeping" },
];

function CollectionPocket({ item, onRemove }: { item: CollectionItem; onRemove: () => void }) {
  const [tradeStatus, setTradeStatus] = useState(item.trade_status);
  const [condition, setCondition] = useState(item.condition);
  const [quantity, setQuantity] = useState(item.quantity);
  const [isPending, startTransition] = useTransition();

  const changeQuantity = (value: number) => {
    const next = Math.max(1, value);
    setQuantity(next);
    startTransition(() => {
      updateQuantity(item.id, next);
    });
  };

  return (
    <div className="min-w-0">
      <PocketSlot card={item.card} tab={STATUS.find((s) => s.value === tradeStatus)?.tab} />
      <div className="mt-2.5 px-0.5">
        <div className="truncate text-sm font-medium text-fg">{item.card.name}</div>
        <div className="truncate text-xs text-muted">
          {item.card.set_name}, #{item.card.card_number}
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-1.5">
          <select
            aria-label={`Trade status for ${item.card.name}`}
            value={tradeStatus}
            onChange={(e) => {
              const value = e.target.value as TradeStatus;
              setTradeStatus(value);
              startTransition(() => {
                updateTradeStatus(item.id, value);
              });
            }}
            className={cx(selectClass, "h-8 w-full min-w-0 px-2.5 text-xs")}
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            aria-label={`Condition of ${item.card.name}`}
            value={condition}
            onChange={(e) => {
              const value = e.target.value as Condition;
              setCondition(value);
              startTransition(() => {
                updateCondition(item.id, value);
              });
            }}
            className={cx(selectClass, "h-8 w-full min-w-0 px-2.5 text-xs")}
          >
            {CONDITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center rounded-full bg-page-2 ring-1 ring-inset ring-line-2">
              <button
                type="button"
                aria-label="One fewer"
                disabled={quantity <= 1}
                onClick={() => changeQuantity(quantity - 1)}
                className="grid size-8 place-items-center rounded-full text-fg-2 hover:text-fg disabled:opacity-35"
              >
                <Minus size={12} weight="bold" aria-hidden />
              </button>
              <span className="min-w-5 text-center font-mono text-xs tabular-nums text-fg" aria-label={`Quantity ${quantity}`}>
                {quantity}
              </span>
              <button
                type="button"
                aria-label="One more"
                onClick={() => changeQuantity(quantity + 1)}
                className="grid size-8 place-items-center rounded-full text-fg-2 hover:text-fg"
              >
                <Plus size={12} weight="bold" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              disabled={isPending}
              aria-label={`Remove ${item.card.name}`}
              title="Remove"
              onClick={() => {
                onRemove();
                startTransition(() => {
                  removeFromCollection(item.id);
                });
              }}
              className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-45"
            >
              <Trash size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | TradeStatus;

export function CollectionBinder({ items }: { items: CollectionItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const live = items.filter((i) => !removed.has(i.id));
  const shown = live.filter((i) => filter === "all" || i.trade_status === filter);
  const count = (s: TradeStatus) => live.filter((i) => i.trade_status === s).length;

  const pockets = fillPage([
    ...shown.map((item) => (
      <CollectionPocket
        key={item.id}
        item={item}
        onRemove={() => setRemoved((r) => new Set(r).add(item.id))}
      />
    )),
    <div key="add" className="min-w-0">
      <AddPocket href="/cards" label="Add card" />
    </div>,
  ]);

  return (
    <div>
      <Pills
        label="Trade status"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All (${live.length})` },
          ...STATUS.map((s) => ({ value: s.value, label: `${s.label} (${count(s.value)})` })),
        ]}
      />
      <div className="mt-6">
        <Binder key={filter} pockets={pockets} label="Collection binder" />
      </div>
      {shown.length === 0 && live.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted">No cards with this status.</p>
      )}
    </div>
  );
}
