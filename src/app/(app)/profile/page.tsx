import Link from "next/link";
import { CalendarBlank, MapPin, PencilSimple, SignOut } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Pocket } from "@/components/Pocket";
import { sleeveFor } from "@/components/Collector";
import { ProfileTabs, type ProfileCardItem } from "@/components/ProfileTabs";
import { LocalTime } from "@/components/LocalTime";
import { TradingRecordSection } from "@/components/TrustPanel";
import { ButtonLink, buttonClass, IdentityBadge, TrustChip } from "@/components/ui";
import { getTradingRecord } from "@/lib/trust";

export const metadata = { title: "Profile" };

type CollectionRow = {
  id: string;
  trade_status: "keep" | "maybe" | "available" | "for_sale";
  card: { name: string; set_name: string; card_number: string; image_url: string | null; language?: string | null } | null;
};

type WantRow = {
  id: string;
  priority: "low" | "medium" | "high";
  card: { name: string; set_name: string; card_number: string; image_url: string | null; language?: string | null } | null;
};

const TRADE_STATUS_LABEL: Record<CollectionRow["trade_status"], string> = {
  keep: "Keeping",
  maybe: "Maybe",
  available: "For trade",
  for_sale: "For sale",
};

const TRADE_STATUS_TAB: Partial<Record<CollectionRow["trade_status"], string>> = {
  available: "Trade",
  maybe: "Maybe",
  for_sale: "Sale",
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

  const [{ data: profile }, { data: collection }, { data: wants }, record, { data: recentTrades }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, location, verified, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("collection")
      .select("id, trade_status, card:cards(name, set_name, card_number, image_url, language)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<CollectionRow[]>(),
    supabase
      .from("wants")
      .select("id, priority, card:cards(name, set_name, card_number, image_url, language)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<WantRow[]>(),
    getTradingRecord(user.id),
    // RLS: only the caller's own trades.
    supabase
      .from("trades")
      .select("id, code, completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(4),
  ]);

  const toCollectionItem = (row: CollectionRow): ProfileCardItem => ({
    id: row.id,
    name: row.card?.name ?? "Unknown card",
    setName: row.card?.set_name ?? "",
    cardNumber: row.card?.card_number ?? "",
    imageUrl: row.card?.image_url ?? null,
    language: row.card?.language ?? null,
    statusLabel: TRADE_STATUS_LABEL[row.trade_status],
    tab: TRADE_STATUS_TAB[row.trade_status],
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
    language: row.card?.language ?? null,
    statusLabel: PRIORITY_LABEL[row.priority],
  }));

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  const displayName = profile?.display_name ?? user.email ?? "Trader";

  return (
    <div>
      {/* Identity */}
      <header className="relative overflow-hidden rounded-xl bg-cover p-5 ring-1 ring-inset ring-line md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-5">
            <div className="grid size-24 shrink-0 place-items-center rounded-[28%] bg-page-2 ring-1 ring-inset ring-line-2 md:size-28">
              <Pocket crop="face" sleeve={sleeveFor(user.id)} size={92} animate={false} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-bold tracking-tight md:text-4xl">{displayName}</h1>
              {user.email && <div className="mt-0.5 truncate text-muted">{user.email}</div>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <IdentityBadge verified={profile?.verified ?? false} className="mr-1" />
                {record.trustedTrader && <TrustChip kind="trusted" />}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-2 md:ml-auto md:flex-col md:items-end md:text-right">
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-muted" aria-hidden /> {profile.location}
              </span>
            )}
            {memberSince && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank size={15} className="text-muted" aria-hidden /> Member since {memberSince}
              </span>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
          <ButtonLink href="/settings" variant="secondary">
            <PencilSimple size={16} aria-hidden /> Edit profile
          </ButtonLink>
          <ButtonLink href="/collection" variant="ghost">
            Open binder
          </ButtonLink>
          <ButtonLink href="/matches" variant="ghost">
            See matches
          </ButtonLink>
          <form action={signOut} className="ml-auto">
            <button type="submit" className={buttonClass("ghost")}>
              <SignOut size={16} aria-hidden /> Log out
            </button>
          </form>
        </div>
      </header>

      {/* Counts */}
      <section aria-label="Your cards" className="mt-6 rounded-lg bg-page ring-1 ring-inset ring-line">
        <dl className="grid grid-cols-3 divide-x divide-line">
          {[
            [collectionItems.length, "Cards"],
            [wantItems.length, "Wants"],
            [availableItems.length, "Up for trade"],
          ].map(([v, k]) => (
            <div key={k} className="flex flex-col-reverse px-5 py-5 md:px-7">
              <dt className="mt-1 text-sm text-muted">{k}</dt>
              <dd className="font-display text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6">
        <TradingRecordSection record={record} whose="your" />
      </div>

      {recentTrades && recentTrades.length > 0 && (
        <section aria-label="Recent verified trades" className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">Recent verified trades</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recentTrades.map((t) => (
              <Link key={t.id} href={`/trades/${t.id}`} className="receipt block px-5 pb-5 pt-6 transition hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-semibold">#{t.code}</span>
                  {t.completed_at && (
                    <span className="text-sm text-paper-muted">
                      <LocalTime iso={t.completed_at} format="date" />
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm font-medium">View receipt</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-label="Cards" className="mt-10">
        <ProfileTabs available={availableItems} collection={collectionItems} wants={wantItems} />
      </section>
    </div>
  );
}
