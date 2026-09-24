import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/Mascot";
import { CollectionRow, type CollectionItem } from "./CollectionRow";

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("collection")
    .select(
      "id, quantity, trade_status, card:cards(id, name, set_name, card_number, image_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<CollectionItem[]>();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold tracking-tight">My Collection</h1>
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          Cards you HAVE and could trade away.
        </span>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error.message}</p>}

      {data && data.length === 0 && (
        <div className="glass flex flex-col items-center gap-4 rounded-card px-8 py-16 text-center">
          <Mascot mood="thinking" size={80} color="cyan" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Nothing here yet</p>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              <Link href="/cards" className="underline">
                Search for a card
              </Link>{" "}
              to add it to your collection.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data?.map((item) => (
          <CollectionRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
