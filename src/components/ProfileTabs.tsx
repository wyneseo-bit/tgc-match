"use client";

import { useState } from "react";
import { TcgCard } from "./TcgCard";

export type ProfileCardItem = {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  imageUrl: string | null;
  statusLabel: string;
  statusColor: string;
};

export function ProfileTabs({
  available,
  collection,
  wants,
}: {
  available: ProfileCardItem[];
  collection: ProfileCardItem[];
  wants: ProfileCardItem[];
}) {
  const [tab, setTab] = useState<"available" | "collection" | "wants">("available");

  const tabs = [
    { key: "available" as const, label: "Available", items: available },
    { key: "collection" as const, label: "Collection", items: collection },
    { key: "wants" as const, label: "Wants", items: wants },
  ];

  const active = tabs.find((t) => t.key === tab)!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="pb-3 text-sm font-medium"
            style={{
              color: tab === t.key ? "var(--color-text)" : "var(--color-muted)",
              borderBottom: tab === t.key ? "2px solid var(--color-indigo)" : "2px solid transparent",
            }}
          >
            {t.label} ({t.items.length})
          </button>
        ))}
      </div>

      {active.items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Nothing here yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {active.items.map((item) => (
            <div key={item.id} className="flex flex-col items-center gap-2 text-center">
              <TcgCard width={148} imageUrl={item.imageUrl} alt={item.name} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {item.setName} · #{item.cardNumber}
                </p>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: item.statusColor }}
                >
                  {item.statusLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
