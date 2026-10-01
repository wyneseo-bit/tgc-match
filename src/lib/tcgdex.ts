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
  language: CardLanguage;
};

/** Printed languages we carry. English is the default catalogue. */
export type CardLanguage = "en" | "ja";

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
    language: "en",
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
      language: "en" as const,
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

// ---------------------------------------------------------------------------
// Japanese cards
//
// TCGdex keeps Japanese cards in a separate catalogue (/v2/ja) whose ids can
// collide with other languages (e.g. "SV-P-001"), so they're stored with a
// "ja:" prefix. Names are in Japanese; English searches go through the
// National Pokédex number (see dex-names.json), which is shared across
// languages. The API often omits Japanese image paths even though the CDN
// has them, so image URLs are rebuilt from series/set/number.
// ---------------------------------------------------------------------------

const JA_BASE_URL = "https://api.tcgdex.net/v2/ja";
const JA_PREFIX = "ja:";

export function cardKey(language: CardLanguage, tcgdexId: string) {
  return language === "en" ? tcgdexId : `${JA_PREFIX}${tcgdexId}`;
}

export function parseCardKey(key: string): { language: CardLanguage; tcgdexId: string } {
  return key.startsWith(JA_PREFIX)
    ? { language: "ja", tcgdexId: key.slice(JA_PREFIX.length) }
    : { language: "en", tcgdexId: key };
}

type JaSet = { id: string; name: string; serie: string };
let jaSetsCache: Cached<JaSet[]> | null = null;

/** Every Japanese set with its series id (needed to build image URLs). */
async function getJaSets(): Promise<JaSet[]> {
  if (jaSetsCache && Date.now() - jaSetsCache.at < OPTIONS_TTL_MS) {
    return jaSetsCache.value;
  }
  const series = await fetchJson<{ id: string }[]>(`${JA_BASE_URL}/series`);
  const details = await Promise.all(
    series.map((s) =>
      fetchJson<{ id: string; sets: { id: string; name: string }[] }>(`${JA_BASE_URL}/series/${encodeURIComponent(s.id)}`),
    ),
  );
  const value = details.flatMap((d) => d.sets.map((set) => ({ id: set.id, name: set.name, serie: d.id })));
  jaSetsCache = { at: Date.now(), value };
  return value;
}

function jaSetOf(cardId: string, sets: JaSet[]) {
  let best: JaSet | undefined;
  for (const set of sets) {
    if (cardId.startsWith(`${set.id}-`) && (!best || set.id.length > best.id.length)) best = set;
  }
  return best;
}

function toJaCard(b: CardBrief, sets: JaSet[]): CachedCard {
  const set = jaSetOf(b.id, sets);
  const image = b.image
    ? `${b.image}/high.webp`
    : set
      ? `https://assets.tcgdex.net/ja/${set.serie}/${set.id}/${b.localId}/high.webp`
      : null;
  return {
    id: cardKey("ja", b.id),
    name: b.name,
    set_name: set?.name ?? "Unknown set",
    card_number: b.localId,
    image_url: image,
    language: "ja",
  };
}

export type JaQuery = {
  /** Text in Japanese script, matched against card names. */
  nativeName?: string;
  /** National Pokédex numbers to fetch (one request each). */
  dexIds?: number[];
  number?: string | null;
  page?: number;
};

const JA_MAX_DEX_IDS = 3;

export async function searchJapaneseCards(query: JaQuery): Promise<{ cards: CachedCard[]; hasMore: boolean }> {
  const sets = await getJaSets();
  const page = query.page ?? 1;

  let briefs: CardBrief[];
  if (query.dexIds?.length) {
    // The API can't OR dexIds, so fetch each species and merge. These lists
    // are short (tens of cards), so paging happens locally.
    const lists = await Promise.all(
      query.dexIds.slice(0, JA_MAX_DEX_IDS).map((id) => fetchJson<CardBrief[]>(`${JA_BASE_URL}/cards?dexId=eq:${id}`)),
    );
    briefs = lists.flat();
  } else if (query.nativeName) {
    briefs = await fetchJson<CardBrief[]>(`${JA_BASE_URL}/cards?name=${encodeURIComponent(query.nativeName)}`);
  } else {
    return { cards: [], hasMore: false };
  }

  const wanted = query.number ? Number(query.number) : null;
  const matching = (wanted === null ? briefs : briefs.filter((b) => numericPart(b.localId) === wanted))
    // Newest sets first: ids sort roughly by era.
    .sort((a, b) => b.id.localeCompare(a.id));

  const start = (page - 1) * SEARCH_PAGE_SIZE;
  return {
    cards: matching.slice(start, start + SEARCH_PAGE_SIZE).map((b) => toJaCard(b, sets)),
    hasMore: matching.length > start + SEARCH_PAGE_SIZE,
  };
}

// Recognizable modern Japanese printings, each checked against the CDN.
export const POPULAR_JA_CARD_IDS = [
  "SV2a-201", // リザードンex (Charizard ex), ポケモンカード151
  "SV8-136", // ピカチュウex (Pikachu ex)
  "SV8a-092", // ブラッキー (Umbreon), テラスタルフェスex
  "SV2a-205", // ミュウex (Mew ex), ポケモンカード151
  "S8b-252", // レックウザVMAX (Rayquaza VMAX), VMAXクライマックス
  "SV5K-088", // ゲンガーex (Gengar ex)
  "SV2a-183", // ミュウツー (Mewtwo), ポケモンカード151
  "SVLN-009", // イーブイ (Eevee)
  "S9-075", // ガブリアス (Garchomp)
];

export async function getJapaneseCardsByIds(ids: string[]): Promise<CachedCard[]> {
  const sets = await getJaSets();
  const cards = await Promise.all(
    ids.map((id) => fetchJson<CardFull>(`${JA_BASE_URL}/cards/${encodeURIComponent(id)}`)),
  );
  return cards.map((c) => toJaCard(c, sets));
}

