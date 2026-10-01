"use client";

import { useState, useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import { AddPocket, EmptySlot } from "@/components/Card";
import { Binder, fillPage } from "@/components/Binder";
import { Pills } from "@/components/Pills";
import { cx, selectClass } from "@/components/ui";
import { CONDITION_OPTIONS, type Condition } from "@/lib/card-condition";
import { LANGUAGE_OPTIONS } from "@/lib/card-language";
import { removeFromWants, updateCondition, updateLanguage, updatePriority } from "./actions";

type Card = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

type Priority = "low" | "medium" | "high";

export type WantItem = {
  id: string;
  priority: Priority;
  condition: Condition;
  language: string | null;
  card: Card;
};

function WantPocket({
  item,
  matchCount,
  holderCount,
  onRemove,
}: {
  item: WantItem;
  /** How many of your matches include this card. */
  matchCount: number;
  /** How many other collectors hold this card for trade. */
  holderCount: number;
  onRemove: () => void;
}) {
  const [priority, setPriority] = useState(item.priority);
  const [condition, setCondition] = useState(item.condition);
  const [language, setLanguage] = useState(item.language ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-w-0">
      <div className="relative">
        <EmptySlot card={item.card} lit={matchCount > 0 || holderCount > 0} />
        {priority === "high" && (
          <span className="absolute -top-2 right-3 rounded-t-[6px] rounded-b-[3px] bg-pear px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pear-ink">
            Top
          </span>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <div className="truncate text-sm font-medium text-fg">{item.card.name}</div>
        <div className="truncate text-xs text-muted">
          {item.card.set_name}, #{item.card.card_number}
        </div>
        <div
          className={cx(
            "mt-1.5 text-xs font-medium",
            matchCount > 0 ? "text-pear" : holderCount > 0 ? "text-fg-2" : "text-muted",
          )}
        >
          {matchCount > 0
            ? `In ${matchCount} match${matchCount > 1 ? "es" : ""}`
            : holderCount > 0
              ? `${holderCount} collector${holderCount > 1 ? "s have" : " has"} it`
              : "Nobody has it yet"}
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-1.5">
          <span className="text-[11px] text-muted">Min. condition, language, priority</span>
          <select
            aria-label={`Minimum condition accepted for ${item.card.name}`}
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
          <select
            aria-label={`Language wanted for ${item.card.name}`}
            value={language}
            onChange={(e) => {
              const value = e.target.value;
              setLanguage(value);
              startTransition(() => {
                updateLanguage(item.id, value || null);
              });
            }}
            className={cx(selectClass, "h-8 w-full min-w-0 px-2.5 text-xs")}
          >
            <option value="">Any language</option>
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <select
              aria-label={`Priority for ${item.card.name}`}
              value={priority}
              onChange={(e) => {
                const value = e.target.value as Priority;
                setPriority(value);
                startTransition(() => {
                  updatePriority(item.id, value);
                });
              }}
              className={cx(selectClass, "h-8 min-w-0 flex-1 px-2.5 text-xs")}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="button"
              disabled={isPending}
              aria-label={`Remove ${item.card.name} from wants`}
              title="Remove"
              onClick={() => {
                onRemove();
                startTransition(() => {
                  removeFromWants(item.id);
                });
              }}
              className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-45"
            >
              <Trash size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | "matched" | Priority;

export function WantsBinder({
  items,
  matchCounts,
  holderCounts,
}: {
  items: WantItem[];
  matchCounts: Record<string, number>;
  holderCounts: Record<string, number>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const live = items.filter((i) => !removed.has(i.id));
  const matched = live.filter((i) => matchCounts[i.card.id] > 0);
  const shown =
    filter === "all" ? live : filter === "matched" ? matched : live.filter((i) => i.priority === filter);

  const pockets = fillPage([
    ...shown.map((item) => (
      <WantPocket
        key={item.id}
        item={item}
        matchCount={matchCounts[item.card.id] ?? 0}
        holderCount={holderCounts[item.card.id] ?? 0}
        onRemove={() => setRemoved((r) => new Set(r).add(item.id))}
      />
    )),
    <div key="add" className="min-w-0">
      <AddPocket href="/cards" label="Add want" />
    </div>,
  ]);

  return (
    <div>
      <Pills
        label="Filter wants"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All (${live.length})` },
          { value: "matched", label: `In a match (${matched.length})` },
          { value: "high", label: "High priority" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
      />
      <div className="mt-6">
        <Binder key={filter} pockets={pockets} label="Wants binder" />
      </div>
      {shown.length === 0 && live.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted">No wants match this filter.</p>
      )}
    </div>
  );
}
