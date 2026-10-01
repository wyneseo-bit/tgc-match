// Regenerates src/lib/dex-names.json: English Pokémon species name (folded to
// lowercase letters and digits) -> National Pokédex number, from PokéAPI.
// Japanese cards in TCGdex carry Japanese names but share Pokédex numbers,
// so searching "umbreon" in Japanese looks up 197 here and asks TCGdex for
// dexId 197. Re-run when a new generation adds species:
//   node scripts/build-dex-names.mjs
import { writeFileSync } from "node:fs";

const URL_ = "https://pokeapi.co/api/v2/pokemon-species?limit=5000";
const OUT = new URL("../src/lib/dex-names.json", import.meta.url);

const res = await fetch(URL_);
if (!res.ok) throw new Error(`PokéAPI HTTP ${res.status}`);
const { results } = await res.json();

const fold = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const names = {};
for (const { name, url } of results) {
  const id = Number(url.match(/\/(\d+)\/?$/)[1]);
  names[fold(name)] = id;
}

writeFileSync(OUT, JSON.stringify(names) + "\n");
console.log(`Wrote ${Object.keys(names).length} species to ${OUT.pathname}`);
