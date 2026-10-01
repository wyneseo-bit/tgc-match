// Printed languages a card can come in. Stored as the short code in
// collection.language / wants.language.
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "zh-tw", label: "Chinese (Trad.)" },
  { value: "zh-cn", label: "Chinese (Simp.)" },
  { value: "ko", label: "Korean" },
  { value: "th", label: "Thai" },
  { value: "id", label: "Indonesian" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
] as const;

export type Language = (typeof LANGUAGE_OPTIONS)[number]["value"];

// The catalogue is English, so a collection card with no language set is
// treated as English.
export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: string): value is Language {
  return LANGUAGE_OPTIONS.some((o) => o.value === value);
}

export function languageLabel(value: string | null | undefined) {
  return LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

/**
 * True when a card printed in `have` satisfies a want for `want`.
 * A want with no language accepts any printing.
 */
export function satisfiesLanguage(have: string | null, want: string | null) {
  if (!want) return true;
  return (have ?? DEFAULT_LANGUAGE) === want;
}
