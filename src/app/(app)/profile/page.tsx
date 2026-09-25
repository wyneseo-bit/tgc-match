import { BadgeCheck, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/Mascot";
import { ProfileTabs, type ProfileCardItem } from "@/components/ProfileTabs";

type CollectionRow = {
  id: string;
  trade_status: "keep" | "maybe" | "available" | "for_sale";
  card: { name: string; set_name: string; card_number: string; image_url: string | null } | null;
};

type WantRow = {
  id: string;
  priority: "low" | "medium" | "high";
  card: { name: string; set_name: string; card_number: string; image_url: string | null } | null;
};

const TRADE_STATUS_LABEL: Record<CollectionRow["trade_status"], string> = {
  keep: "Keep",
  maybe: "Maybe",
  available: "Available",
  for_sale: "For sale",
};

const TRADE_STATUS_COLOR: Record<CollectionRow["trade_status"], string> = {
  keep: "var(--color-muted)",
  maybe: "var(--color-muted)",
  available: "var(--color-cyan)",
  for_sale: "var(--color-cyan)",
};

const PRIORITY_LABEL: Record<WantRow["priority"], string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: collection }, { data: wants }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, location, verified, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("collection")
      .select("id, trade_status, card:cards(name, set_name, card_number, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<CollectionRow[]>(),
    supabase
      .from("wants")
      .select("id, priority, card:cards(name, set_name, card_number, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<WantRow[]>(),
  ]);

  const toCollectionItem = (row: CollectionRow): ProfileCardItem => ({
    id: row.id,
    name: row.card?.name ?? "Unknown card",
    setName: row.card?.set_name ?? "",
    cardNumber: row.card?.card_number ?? "",
    imageUrl: row.card?.image_url ?? null,
    statusLabel: TRADE_STATUS_LABEL[row.trade_status],
    statusColor: TRADE_STATUS_COLOR[row.trade_status],
  });

  const collectionItems = (collection ?? []).map(toCollectionItem);
  const availableItems = (collection ?? [])
    .filter((r) => r.trade_status === "available" || r.trade_status === "for_sale")
    .map(toCollectionItem);
  const wantItems: ProfileCardItem[] = (wants ?? []).map((row) => ({
    id: row.id,
    name: row.card?.name ?? "Unknown card",
    setName: row.card?.set_name ?? "",
    cardNumber: row.card?.card_number ?? "",
    imageUrl: row.card?.image_url ?? null,
    statusLabel: PRIORITY_LABEL[row.priority],
    statusColor: "var(--color-muted)",
  }));

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div
          className="relative h-[120px] rounded-card"
          style={{
            background:
              "radial-gradient(400px 200px at 20% 0%, rgba(108,99,255,0.25), transparent 60%), radial-gradient(300px 150px at 80% 100%, rgba(66,217,232,0.2), transparent 60%), var(--color-bg-2)",
          }}
        >
          <div className="absolute bottom-2 right-4">
            <Mascot mood="curious" size={64} color="cyan" />
          </div>
        </div>

        <div className="flex items-end gap-4 px-2">
          <div
            className="z-10 flex h-24 w-24 flex-none items-center justify-center rounded-full border-4 text-3xl font-bold text-white"
            style={{
              marginTop: -40,
              background: "linear-gradient(135deg,#FF8A7A,#A66CFF)",
              borderColor: "var(--color-bg)",
            }}
          >
            {(profile?.display_name ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-1 flex-col gap-1 pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold tracking-tight">
                {profile?.display_name ?? user.email}
              </h1>
              {profile?.verified && (
                <span
                  className="flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-semibold"
                  style={{ color: "var(--color-cyan)", background: "var(--color-cyan-tint)" }}
                >
                  <BadgeCheck size={13} strokeWidth={2} />
                  Identity Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: "var(--color-muted)" }}>
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} strokeWidth={2} />
                  {profile.location}
                </span>
              )}
              {memberSince && <span>Member since {memberSince}</span>}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
        Identity verification confirms who someone is — it doesn&apos;t reflect trade
        history or reputation.
      </p>

      <ProfileTabs available={availableItems} collection={collectionItems} wants={wantItems} />
    </div>
  );
}
