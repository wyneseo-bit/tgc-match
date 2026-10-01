"use client";

import { useState } from "react";
import { EmptySlot, PocketSlot } from "./Card";
import { Pills } from "./Pills";

export type ProfileCardItem = {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  imageUrl: string | null;
  language?: string | null;
  statusLabel: string;
  /** Binder-divider tab on the pocket, for cards visible to matches. */
  tab?: string;
};

type Tab = "available" | "collection" | "wants";

export function ProfileTabs({
  available,
  collection,
  wants,
}: {
  available: ProfileCardItem[];
  collection: ProfileCardItem[];
  wants: ProfileCardItem[];
}) {
  const [tab, setTab] = useState<Tab>("available");
  const lists: Record<Tab, ProfileCardItem[]> = { available, collection, wants };
  const items = lists[tab];

  return (
    <div>
      <Pills
        label="Show cards"
        value={tab}
        onChange={setTab}
        options={[
          { value: "available", label: `Up for trade (${available.length})` },
          { value: "collection", label: `Collection (${collection.length})` },
          { value: "wants", label: `Wants (${wants.length})` },
        ]}
      />

      {items.length === 0 ? (
        <p className="mt-6 rounded-lg bg-page p-6 text-center text-muted ring-1 ring-inset ring-line">Nothing here yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5 rounded-lg bg-page p-4 ring-1 ring-inset ring-line sm:grid-cols-4 md:p-6 lg:grid-cols-6">
          {items.map((item) => {
            const card = {
              name: item.name,
              set_name: item.setName,
              card_number: item.cardNumber,
              image_url: item.imageUrl,
              language: item.language,
            };
            return (
              <div key={item.id} className="min-w-0">
                {tab === "wants" ? <EmptySlot card={card} /> : <PocketSlot card={card} tab={item.tab} />}
                <div className="mt-2.5 px-0.5">
                  <div className="truncate text-sm font-medium text-fg">{item.name}</div>
                  <div className="truncate text-xs text-muted">{item.statusLabel}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
