import dexNames from "./dex-names.json";

const NAMES = dexNames as Record<string, number>;
const KEYS = Object.keys(NAMES);

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Pokédex numbers for an English search like "umbreon", "charizard ex" or
 * "mr mime". Tries the whole phrase, then each word, then a small typo
 * allowance ("umbreaon" -> umbreon). Card-type words (ex, vmax...) just
 * don't match a species and are skipped.
 */
export function dexIdsForEnglish(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/).map(fold).filter(Boolean);
  if (words.length === 0) return [];

  const whole = words.join("");
  if (NAMES[whole]) return [NAMES[whole]];

  const found = new Set<number>();
  for (let n = words.length; n >= 1 && found.size === 0; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const id = NAMES[words.slice(i, i + n).join("")];
      if (id) found.add(id);
    }
  }
  if (found.size) return [...found];

  for (const word of words) {
    if (word.length < 5) continue;
    let best: { key: string; d: number } | null = null;
    for (const key of KEYS) {
      const d = distance(word, key, 2);
      if (d <= 2 && (!best || d < best.d)) best = { key, d };
    }
    if (best) found.add(NAMES[best.key]);
  }
  return [...found];
}

/** True for text with Japanese characters, which is searched as a name directly. */
export function isJapaneseText(text: string) {
  return /[぀-ヿ㐀-鿿ｦ-ﾟ]/.test(text);
}
