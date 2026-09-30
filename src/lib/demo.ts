/**
 * Illustrative cards for the logged-out landing page. Real TCGdex cards so the
 * artwork is genuine, but nothing here is read from or written to Supabase.
 */
import type { CardFace } from "@/components/Card";

const tcgdex = (path: string) => `https://assets.tcgdex.net/en/${path}/high.webp`;

export const DEMO_CARDS = {
  umbreon: { name: "Umbreon VMAX", set_name: "Evolving Skies", card_number: "215", image_url: tcgdex("swsh/swsh7/215") },
  charizardEx: { name: "Charizard ex", set_name: "151", card_number: "199", image_url: tcgdex("sv/sv03.5/199") },
  giratina: { name: "Giratina V", set_name: "Lost Origin", card_number: "186", image_url: tcgdex("swsh/swsh11/186") },
  lugia: { name: "Lugia V", set_name: "Silver Tempest", card_number: "186", image_url: tcgdex("swsh/swsh12/186") },
  mewEx: { name: "Mew ex", set_name: "Paldean Fates", card_number: "232", image_url: tcgdex("sv/sv04.5/232") },
  rayquaza: { name: "Rayquaza VMAX", set_name: "Evolving Skies", card_number: "218", image_url: tcgdex("swsh/swsh7/218") },
  gengar: { name: "Gengar VMAX", set_name: "Fusion Strike", card_number: "157", image_url: tcgdex("swsh/swsh8/157") },
  gardevoir: { name: "Gardevoir ex", set_name: "Scarlet & Violet", card_number: "245", image_url: tcgdex("sv/sv01/245") },
  charizardV: { name: "Charizard V", set_name: "Brilliant Stars", card_number: "154", image_url: tcgdex("swsh/swsh9/154") },
  iono: { name: "Iono", set_name: "Paldea Evolved", card_number: "254", image_url: tcgdex("sv/sv02/254") },
  altaria: { name: "Altaria ex", set_name: "Paradox Rift", card_number: "232", image_url: tcgdex("sv/sv04/232") },
  irida: { name: "Irida", set_name: "Astral Radiance", card_number: "186", image_url: tcgdex("swsh/swsh10/186") },
  charizardObf: { name: "Charizard ex", set_name: "Obsidian Flames", card_number: "223", image_url: tcgdex("sv/sv03/223") },
  baseCharizard: { name: "Charizard", set_name: "Base Set", card_number: "4", image_url: tcgdex("base/base1/4") },
  blastoise: { name: "Blastoise", set_name: "Base Set", card_number: "2", image_url: tcgdex("base/base1/2") },
  venusaur: { name: "Venusaur", set_name: "Base Set", card_number: "15", image_url: tcgdex("base/base1/15") },
  pikachu: { name: "Pikachu", set_name: "Base Set", card_number: "58", image_url: tcgdex("base/base1/58") },
} satisfies Record<string, CardFace>;

export type DemoCardKey = keyof typeof DEMO_CARDS;

export const demo = (key: DemoCardKey): CardFace => DEMO_CARDS[key];

/** The one example collector shown on the landing page. */
export const DEMO_COLLECTOR = { id: "demo-aiman", name: "Aiman R.", location: "Petaling Jaya" };
