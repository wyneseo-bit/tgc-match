const BASE_URL = "https://api.pokemontcg.io/v2";

export type PokemonTcgCard = {
  id: string;
  name: string;
  number: string;
  images?: { small?: string; large?: string };
  set?: { name?: string };
};

// pokemontcg.io is a free, community-run API that intermittently returns
// 5xx errors under normal load — retry transient failures before giving up.
const MAX_ATTEMPTS = 3;

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

  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(`${BASE_URL}/cards?${params}`, { headers });

    if (res.ok) {
      const json = await res.json();
      return json.data as PokemonTcgCard[];
    }

    lastStatus = res.status;
    if (res.status < 500 || attempt === MAX_ATTEMPTS) break;

    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }

  throw new Error(`pokemontcg.io request failed: ${lastStatus}`);
}
