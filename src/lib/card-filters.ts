export const FINISH_OPTIONS = [
  { value: "holo", label: "Holo" },
  { value: "reverse", label: "Reverse holo" },
  { value: "firstEdition", label: "1st edition" },
] as const;

export type Finish = (typeof FINISH_OPTIONS)[number]["value"];

export function isFinish(value: string): value is Finish {
  return FINISH_OPTIONS.some((o) => o.value === value);
}

// `official` is the set's printed card count — the "102" in "4/102".
export type SetInfo = { id: string; name: string; official?: number };

// Explicit filters picked in the UI (as opposed to ones inferred from the
// search text).
export type CardFilters = {
  setId?: string;
  rarity?: string;
  type?: string;
  category?: string;
  finish?: Finish;
};

// Things the parser inferred from the text that the user can switch off.
export type IgnoreKey = "set" | "number" | "delta" | "typo";

const IGNORE_KEYS: readonly string[] = ["set", "number", "delta", "typo"];

export function isIgnoreKey(value: string): value is IgnoreKey {
  return IGNORE_KEYS.includes(value);
}

export type SearchInterpretation = {
  sets: SetInfo[];
  number: string | null;
  printedTotal: string | null;
  delta: "marker" | "set" | null;
  corrections: { from: string; to: string }[];
  searchedName: string;
};

export type FilterOptions = {
  sets: SetInfo[];
  rarities: string[];
  types: string[];
  categories: string[];
};

// TCGdex's category value is "Pokemon"; show the accented spelling.
export function categoryLabel(category: string) {
  return category === "Pokemon" ? "Pokémon" : category;
}
