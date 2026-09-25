// pokemontcg.io (the API this originally used) is deprecated: new
// registrations are closed and existing keys stop working 2027-03-01.
// TCGdex (api.tcgdex.net) is free, open source (MIT), needs no API key, and
// uses the same card id scheme (e.g. "base1-4"), so cached rows and existing
// collection/wants references keep working across the swap.
const BASE_URL = "https://api.tcgdex.net/v2/en";
const MAX_RESULTS = 20;
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

export async function searchCards(query: string): Promise<CachedCard[]> {
  const params = new URLSearchParams({
    name: query,
    // The list endpoint has no per-search cap by default (a query like
    // "pikachu" returns 200+ brief results) — cap it before fetching full
    // card details, since the brief result omits set name/pricing.
    "pagination:itemsPerPage": String(MAX_RESULTS),
  });

  const briefs = await fetchJson<CardBrief[]>(`${BASE_URL}/cards?${params}`);

  const fullCards = await Promise.all(
    briefs.map((b) => fetchJson<CardFull>(`${BASE_URL}/cards/${b.id}`)),
  );

  return fullCards.map(toCachedCard);
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
