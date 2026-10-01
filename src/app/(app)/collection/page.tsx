import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { CollectionBinder, type CollectionItem } from "./CollectionBinder";

export const metadata = { title: "Collection" };

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("collection")
    .select(
      "id, quantity, trade_status, condition, language, card:cards(id, name, set_name, card_number, image_url)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<CollectionItem[]>();

  if (data && data.length === 0) {
    return (
      <EmptyState
        expression="curious"
        prop="empty-binder"
        title="Your binder is looking a little empty."
        body="Add the cards you own, then mark the ones you'd trade. We'll start looking for collectors who want them."
        actions={[{ href: "/cards", label: "Find cards to add", variant: "primary" }]}
      />
    );
  }

  const items = data ?? [];
  const totalCards = items.reduce((n, i) => n + i.quantity, 0);
  const tradeable = items.filter((i) => i.trade_status === "available" || i.trade_status === "maybe").length;

  return (
    <div>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your binder</h1>
          <p className="mt-2 text-muted">
            Cards tabbed &quot;Trade&quot; or &quot;Maybe&quot; are visible to matching collectors.
          </p>
        </div>
        <dl className="flex gap-8">
          {[
            ["Cards", totalCards],
            ["Unique", items.length],
            ["Up for trade", tradeable],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      {error && <p className="mt-6 text-sm text-danger">{error.message}</p>}

      <div className="mt-8">
        <CollectionBinder items={items} />
      </div>
    </div>
  );
}
