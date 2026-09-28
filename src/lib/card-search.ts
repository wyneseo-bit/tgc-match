import vocabulary from "./card-vocabulary.json";
import type {
  IgnoreKey,
  SearchInterpretation,
  SetInfo,
} from "./card-filters";

export type ParsedQuery = {
  nameText: string;
  setIds: string[];
  number: string | null;
  interpretation: SearchInterpretation;
};

const WORDS: readonly string[] = vocabulary.words;
const WORD_SET = new Set(WORDS);
const ACCENTED = Object.entries(vocabulary.accents as Record<string, string>);

const STOPWORDS = new Set(["anniversary", "card", "cards", "from", "set"]);
const MAX_SET_PHRASE_WORDS = 4;
const NUMBER_OR_ORDINAL = /^(\d{1,4})(st|nd|rd|th)?$/;

// Celebrations is the 25th-anniversary set but its name has no "25" in it,
// unlike "30th Celebration". Ids that don't exist in the live set list are
// skipped, so a stale entry here is harmless.
const ANNIVERSARY_SET_IDS: Record<string, string[]> = {
  "25": ["cel25", "cel25cc"],
};

function fold(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function clean(text: string) {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}#/.'-]+/gu, " ")
    .trim();
}

function normalize(text: string) {
  return fold(clean(text));
}

type SetIndex = {
  byPhrase: Map<string, SetInfo[]>;
  byId: Map<string, SetInfo>;
};

const indexCache = new WeakMap<SetInfo[], SetIndex>();

function indexSets(sets: SetInfo[]): SetIndex {
  const cached = indexCache.get(sets);
  if (cached) return cached;

  const byPhrase = new Map<string, SetInfo[]>();
  const byId = new Map<string, SetInfo>();
  for (const set of sets) {
    const phrase = normalize(set.name);
    byPhrase.set(phrase, [...(byPhrase.get(phrase) ?? []), set]);
    byId.set(set.id.toLowerCase(), set);
  }

  const index = { byPhrase, byId };
  indexCache.set(sets, index);
  return index;
}

// Optimal-string-alignment distance (edits + adjacent swaps), abandoning
// early once every path exceeds `limit`.
function editDistance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;

  let twoAgo: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, twoAgo[j - 2] + 1);
      }
      row.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
    twoAgo = prev;
    prev = row;
  }

  return prev[b.length];
}

// Words that are already a real card word — or the start of one, so a
// half-typed "sala" isn't "corrected" mid-keystroke — are left alone.
function correctWord(word: string): string {
  if (word.length < 4 || !/^[a-z]+$/.test(word)) return word;
  if (WORD_SET.has(word)) return word;
  if (WORDS.some((candidate) => candidate.startsWith(word))) return word;

  const limit = word.length >= 7 ? 2 : 1;
  let best = word;
  let bestDistance = limit + 1;

  // The vocabulary is ordered most-common first, so on a tie the more
  // familiar word wins.
  for (const candidate of WORDS) {
    const distance = editDistance(word, candidate, limit);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

// TCGdex name matching is accent-sensitive, so "poke"/"pokem" must become
// "poké"/"pokém" to match "Poké Ball"/"Pokémon Center".
function restoreAccents(word: string) {
  const exact = vocabulary.accents as Record<string, string>;
  if (exact[word]) return exact[word];

  for (const [plain, accented] of ACCENTED) {
    if (plain.startsWith(word)) {
      const candidate = accented.slice(0, word.length);
      if (candidate !== word) return candidate;
    }
  }

  return word;
}

function stripLeadingZeros(digits: string) {
  return digits.replace(/^0+(?=\d)/, "");
}

// A single word that is both a set name and a word on real cards ("arceus",
// "deoxys", "dragon") is read as a card name first, so searching "arceus"
// doesn't collapse to one set. `allowAmbiguousSets` is the second pass the
// caller runs when that finds nothing (e.g. "jungle vaporeon").
export function parseQuery(
  raw: string,
  sets: SetInfo[],
  ignore: ReadonlySet<IgnoreKey>,
  allowAmbiguousSets = false,
): ParsedQuery {
  const index = indexSets(sets);
  // `originals` keep any accents the user typed (TCGdex needs them);
  // `tokens` are folded for matching against sets and the vocabulary.
  const originals = clean(raw)
    .split(" ")
    .filter(Boolean)
    .map((token) => (token === "δ" ? "delta" : token));
  const tokens = originals.map(fold);
  const used = tokens.map(() => false);

  const matchedSets: SetInfo[] = [];
  const addSet = (set: SetInfo) => {
    if (!matchedSets.some((s) => s.id === set.id)) matchedSets.push(set);
  };
  let number: string | null = null;
  let printedTotal: string | null = null;

  // "#58" and "58/102" are unambiguous card numbers.
  tokens.forEach((token, i) => {
    const match = token.match(/^(#?)(\d{1,4})(?:\/(\d{1,4}))?$/);
    if (!match || (!match[1] && !token.includes("/"))) return;
    used[i] = true;
    if (!ignore.has("number") && number === null) {
      number = stripLeadingZeros(match[2]);
      printedTotal = match[3] ? stripLeadingZeros(match[3]) : null;
    }
  });

  // Set names and ids, longest phrase first so "delta species" wins over a
  // lone "delta". Bare numbers and ordinals are left for the next step so
  // "30" and "30th" behave the same.
  if (!ignore.has("set")) {
    for (let size = MAX_SET_PHRASE_WORDS; size >= 1; size--) {
      for (let start = 0; start + size <= tokens.length; start++) {
        if (used.slice(start, start + size).some(Boolean)) continue;
        const phrase = tokens.slice(start, start + size).join(" ");
        const ambiguous = size === 1 && WORD_SET.has(phrase);
        if (ambiguous && !allowAmbiguousSets) continue;
        const byName = index.byPhrase.get(phrase);
        const byId =
          size === 1 && !NUMBER_OR_ORDINAL.test(phrase)
            ? index.byId.get(phrase)
            : undefined;
        const hits = byName ?? (byId ? [byId] : undefined);
        if (!hits) continue;
        hits.forEach(addSet);
        for (let i = start; i < start + size; i++) used[i] = true;
      }
    }
  }

  // A bare number is an anniversary set if one exists ("30" -> 30th
  // Celebration), otherwise a card number.
  tokens.forEach((token, i) => {
    if (used[i]) return;
    const match = token.match(NUMBER_OR_ORDINAL);
    if (!match) return;
    const digits = match[1];

    if (!ignore.has("set")) {
      const ordinalName = new RegExp(`^${digits}(st|nd|rd|th)\\b`);
      const anniversary = [
        ...sets.filter((s) => ordinalName.test(normalize(s.name))),
        ...sets.filter((s) => ANNIVERSARY_SET_IDS[digits]?.includes(s.id)),
      ];
      if (anniversary.length > 0) {
        anniversary.forEach(addSet);
        used[i] = true;
        return;
      }
    }

    if (!match[2]) {
      used[i] = true;
      if (!ignore.has("number") && number === null) {
        number = stripLeadingZeros(digits);
      }
    }
  });

  let nameTokens = tokens
    .map((folded, i) => ({ folded, original: originals[i] }))
    .filter(({ folded }, i) => !used[i] && !STOPWORDS.has(folded));

  // On the card itself "delta" is the δ marker ("Salamence ex δ"); the set
  // reading (EX Delta Species) is the alternative the user can switch to.
  let delta: "marker" | "set" | null = null;
  if (nameTokens.some((t) => t.folded === "delta")) {
    nameTokens = nameTokens.filter((t) => t.folded !== "delta");
    if (!ignore.has("delta")) {
      delta = "marker";
    } else {
      const deltaSet = sets.find((s) => normalize(s.name) === "delta species");
      if (deltaSet) {
        addSet(deltaSet);
        delta = "set";
      }
    }
  }

  const corrections: { from: string; to: string }[] = [];
  const words = nameTokens.map(({ folded, original }) => {
    const fixed = ignore.has("typo") ? folded : correctWord(folded);
    if (fixed !== folded) {
      corrections.push({ from: original, to: fixed });
      return restoreAccents(fixed);
    }
    // Keep accents the user typed; otherwise restore the ones TCGdex needs.
    return original !== folded ? original : restoreAccents(folded);
  });

  const nameText = [...words, ...(delta === "marker" ? ["δ"] : [])].join(" ");

  // The "102" in "4/102" is a set's printed size. A named set already pins
  // the set, so only use the size when none was named.
  const setIds = matchedSets.map((s) => s.id);
  if (printedTotal && matchedSets.length === 0) {
    for (const set of sets) {
      if (String(set.official) === printedTotal) setIds.push(set.id);
    }
  }

  return {
    nameText,
    setIds,
    number,
    interpretation: {
      sets: matchedSets,
      number,
      printedTotal,
      delta,
      corrections,
      searchedName: nameText,
    },
  };
}
