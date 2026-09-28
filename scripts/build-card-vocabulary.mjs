// Regenerates src/lib/card-vocabulary.json: the distinct words used in TCGdex
// card names (most common first) plus an unaccented -> accented spelling map.
// Search uses it to correct typos ("salamance" -> "salamence") without
// downloading the 2.4 MB catalog at request time. Re-run when a new
// expansion adds new Pokémon names:
//   node scripts/build-card-vocabulary.mjs
import { writeFileSync } from "node:fs";

const BASE_URL = "https://api.tcgdex.net/v2/en";
const OUT = new URL("../src/lib/card-vocabulary.json", import.meta.url);

async function getJson(path, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 500 * i));
    }
  }
}

// The full catalog in one response is ~2.4 MB and the API drops the
// connection mid-transfer, so pull it in pages instead.
const PAGE_SIZE = 1500;
const cards = [];
for (let page = 1; ; page++) {
  const batch = await getJson(
    `/cards?pagination:page=${page}&pagination:itemsPerPage=${PAGE_SIZE}`,
  );
  cards.push(...batch);
  if (batch.length < PAGE_SIZE) break;
}
const sets = await getJson("/sets");

const fold = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

const counts = new Map();
// folded word -> how often it appears accented vs plain on real cards
const spellings = new Map();
for (const { name } of cards) {
  const words = name.toLowerCase().normalize("NFC").split(/[^\p{L}]+/u);
  for (const word of new Set(words)) {
    const folded = fold(word);
    if (folded.length < 4 || !/^[a-z]+$/.test(folded)) continue;
    counts.set(folded, (counts.get(folded) ?? 0) + 1);
    const forms = spellings.get(folded) ?? new Map();
    forms.set(word, (forms.get(word) ?? 0) + 1);
    spellings.set(folded, forms);
  }
}

const words = [...counts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([word]) => word);

// TCGdex name matching is accent-sensitive ("poke ball" finds nothing,
// "poké ball" does), so map an unaccented word to its accented spelling —
// but only when no card spells it plain, otherwise we'd hide those cards.
const accents = {};
for (const word of words) {
  const forms = spellings.get(word);
  if (forms.has(word)) continue;
  const [accented] = [...forms.entries()].sort((a, b) => b[1] - a[1])[0];
  accents[word] = accented;
}

writeFileSync(OUT, JSON.stringify({ words, accents }));

const setIds = sets.map((s) => s.id).sort((a, b) => b.length - a.length);
const unresolved = cards.filter(
  (c) => !setIds.some((id) => c.id.startsWith(`${id}-`)),
);

console.log(`cards: ${cards.length}, sets: ${sets.length}`);
console.log(`vocabulary words: ${words.length}`);
console.log(`accent mappings: ${Object.keys(accents).length}`, accents);
console.log(`cards whose set can't be resolved from the id: ${unresolved.length}`, unresolved.slice(0, 5).map((c) => c.id));
console.log(`cards without an image: ${cards.filter((c) => !c.image).length}`);
