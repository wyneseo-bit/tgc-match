import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WantRow, type WantItem } from "./WantRow";

export default async function WantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("wants")
    .select(
      "id, priority, card:cards(id, name, set_name, card_number, image_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<WantItem[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Wants</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/cards" className="underline">
            Search cards
          </Link>
          <Link href="/collection" className="underline">
            My Collection
          </Link>
          <Link href="/matches" className="underline">
            Matches
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {data && data.length === 0 && (
        <p className="text-zinc-500">
          Nothing here yet —{" "}
          <Link href="/cards" className="underline">
            search for a card
          </Link>{" "}
          to add one.
        </p>
      )}

      <div className="flex flex-col divide-y">
        {data?.map((item) => (
          <WantRow key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
