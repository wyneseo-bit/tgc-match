// pokemontcg.io (the API this originally used) is deprecated: new
// registrations are closed and existing keys stop working 2027-03-01.
// TCGdex (api.tcgdex.net) is free, open source (MIT), needs no API key, and
// uses the same card id scheme (e.g. "base1-4"), so cached rows and existing
// collection/wants references keep working across the swap.
import type { FilterOptions, Finish, SetInfo } from "./card-filters";

const BASE_URL = "https://api.tcgdex.net/v2/en";
const MAX_ATTEMPTS = 3;

type CardBrief = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

type CardFull = CardBrief & {
  set?: { name?: string };
};

export type CachedCard = {
  id: string;
  name: string;
  set_name: string;
  card_number: string;
  image_url: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url);

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    lastStatus = res.status;
    if (res.status < 500 || attempt === MAX_ATTEMPTS) break;

    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }

  throw new Error(`TCGdex request failed: ${lastStatus}`);
}

function toCachedCard(card: CardFull): CachedCard {
  return {
    id: card.id,
    name: card.name,
    set_name: card.set?.name ?? "Unknown set",
    card_number: card.localId,
    // TCGdex serves the bare asset path; the caller picks quality/format
    // (e.g. /high.webp) — see https://tcgdex.dev/assets.
    image_url: card.image ? `${card.image}/high.webp` : null,
  };
}

type Cached<T> = { at: number; value: T };
const OPTIONS_TTL_MS = 6 * 60 * 60 * 1000;
let optionsCache: Cached<FilterOptions> | null = null;

// Sets, rarities, types and categories change only when an expansion ships,
// so keep them per server instance rather than refetching on every search.
export async function getFilterOptions(): Promise<FilterOptions> {
  if (optionsCache && Date.now() - optionsCache.at < OPTIONS_TTL_MS) {
    return optionsCache.value;
  }

  const [sets, rarities, types, categories] = await Promise.all([
    fetchJson<(SetInfo & { cardCount?: { official?: number } })[]>(
      `${BASE_URL}/sets`,
    ),
    fetchJson<string[]>(`${BASE_URL}/rarities`),
    fetchJson<string[]>(`${BASE_URL}/types`),
    fetchJson<string[]>(`${BASE_URL}/categories`),
  ]);

  const value: FilterOptions = {
    sets: sets
      .map(({ id, name, cardCount }) => ({
        id,
        name,
        official: cardCount?.official,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    // "None" is TCGdex's placeholder for cards with no printed rarity.
    rarities: rarities.filter((r) => r !== "None"),
    types,
    categories,
  };
  optionsCache = { at: Date.now(), value };
  return value;
}

export type CardQuery = {
  name?: string;
  setIds?: string[];
  number?: string | null;
  rarity?: string;
  type?: string;
  category?: string;
  finish?: Finish;
  page?: number;
};

export const SEARCH_PAGE_SIZE = 40;
// A card number can't be filtered exactly by the API (ids are zero-padded
// and the match is a substring), so fetch a wide page and match locally.
const NUMBER_SEARCH_LIMIT = 200;

function numericPart(localId: string) {
  const digits = localId.replace(/\D/g, "");
  return digits ? Number(digits) : NaN;
}

// A brief card's id is "<setId>-<localId>"; the longest matching set id wins
// so "30th-c-008" resolves to "30th-c", not "30th".
function resolveSetName(cardId: string, sets: SetInfo[]) {
  let best: SetInfo | undefined;
  for (const set of sets) {
    if (
      cardId.startsWith(`${set.id}-`) &&
      (!best || set.id.length > best.id.length)
    ) {
      best = set;
    }
  }
  return best?.name ?? "Unknown set";
}

export async function searchCardsFiltered(
  query: CardQuery,
): Promise<{ cards: CachedCard[]; hasMore: boolean }> {
  const { sets } = await getFilterOptions();
  const pageSize = query.number ? NUMBER_SEARCH_LIMIT : SEARCH_PAGE_SIZE;

  const params = new URLSearchParams({
    "pagination:itemsPerPage": String(pageSize),
    "pagination:page": String(query.page ?? 1),
  });
  if (query.name) params.set("name", query.name);
  // "|" is the API's OR; "eq:" makes the match exact instead of substring.
  if (query.setIds?.length) {
    params.set("set.id", query.setIds.map((id) => `eq:${id}`).join("|"));
  }
  if (query.rarity) params.set("rarity", `eq:${query.rarity}`);
  if (query.type) params.set("types", `eq:${query.type}`);
  if (query.category) params.set("category", `eq:${query.category}`);
  if (query.finish) params.set(`variants.${query.finish}`, "true");
  if (query.number) params.set("localId", query.number);

  const briefs = await fetchJson<CardBrief[]>(`${BASE_URL}/cards?${params}`);

  const wanted = query.number ? Number(query.number) : null;
  const matching =
    wanted === null
      ? briefs
      : briefs.filter((b) => numericPart(b.localId) === wanted);

  return {
    cards: matching.map((b) => ({
      id: b.id,
      name: b.name,
      set_name: resolveSetName(b.id, sets),
      card_number: b.localId,
      image_url: b.image ? `${b.image}/high.webp` : null,
    })),
    hasMore: wanted === null && briefs.length === pageSize,
  };
}

// A hand-picked set of recognizable cards so the Discover page has something
// to show before the user searches, rather than an empty state. Mixes
// classic Base Set staples with modern chase cards; every id verified
// directly against the live API before being hardcoded here.
export const POPULAR_CARD_IDS = [
  "base1-4", // Charizard, Base Set
  "base1-2", // Blastoise, Base Set
  "base1-15", // Venusaur, Base Set
  "base1-10", // Mewtwo, Base Set
  "base1-58", // Pikachu, Base Set
  "base1-1", // Alakazam, Base Set
  "base1-6", // Gyarados, Base Set
  "swsh7-215", // Umbreon VMAX, Evolving Skies
  "swsh7-218", // Rayquaza VMAX, Evolving Skies
  "swsh8-157", // Gengar VMAX, Fusion Strike
  "sv03.5-151", // Mew ex, 151
];

export async function getCardsByIds(ids: string[]): Promise<CachedCard[]> {
  const fullCards = await Promise.all(
    ids.map((id) => fetchJson<CardFull>(`${BASE_URL}/cards/${id}`)),
  );

  return fullCards.map(toCachedCard);
}
