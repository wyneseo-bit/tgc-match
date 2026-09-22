const BASE_URL = "https://api.pokemontcg.io/v2";

export type PokemonTcgCard = {
  id: string;
  name: string;
  number: string;
  images?: { small?: string; large?: string };
  set?: { name?: string };
};

export async function searchPokemonCards(
  query: string,
): Promise<PokemonTcgCard[]> {
  const params = new URLSearchParams({
    q: `name:${query}*`,
    pageSize: "20",
  });

  const headers: HeadersInit = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  }

  const res = await fetch(`${BASE_URL}/cards?${params}`, { headers });

  if (!res.ok) {
    throw new Error(`pokemontcg.io request failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data as PokemonTcgCard[];
}
