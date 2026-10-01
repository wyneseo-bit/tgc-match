import { notFound, redirect } from "next/navigation";
import { CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { EmptySlot, PocketSlot } from "@/components/Card";
import { sleeveFor } from "@/components/Collector";
import { Pocket } from "@/components/Pocket";
import { ButtonLink, IdentityBadge } from "@/components/ui";

export const metadata = { title: "Collector" };

type CardInfo = { id: string; name: string; set_name: string; card_number: string; image_url: string | null; language?: string | null };
type HaveRow = { id: string; trade_status: "available" | "for_sale"; card: CardInfo };
type WantRow = { id: string; card: CardInfo };

function CardCaption({ card, note, tone }: { card: CardInfo; note?: string; tone?: "pear" }) {
  return (
    <div className="mt-2.5 px-0.5">
      <div className="truncate text-sm font-medium text-fg">{card.name}</div>
      <div className="truncate text-xs text-muted">
        {card.set_name}, #{card.card_number}
      </div>
      {note && <div className={tone === "pear" ? "mt-1 text-xs font-medium text-pear" : "mt-1 text-xs text-muted"}>{note}</div>}
    </div>
  );
}

export default async function CollectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (id === user.id) redirect("/profile");

  const [{ data: collector }, { data: haves }, { data: wants }, { data: myCollection }, { data: myWants }, { data: match }] =
    await Promise.all([
      supabase.from("users").select("id, display_name, location, verified, created_at").eq("id", id).maybeSingle(),
      // RLS only exposes other collectors' available / for-sale cards.
      supabase
        .from("collection")
        .select("id, trade_status, card:cards(id, name, set_name, card_number, image_url, language)")
        .eq("user_id", id)
        .in("trade_status", ["available", "for_sale"])
        .order("created_at", { ascending: false })
        .returns<HaveRow[]>(),
      supabase
        .from("wants")
        .select("id, card:cards(id, name, set_name, card_number, image_url, language)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .returns<WantRow[]>(),
      supabase.from("collection").select("card_id, trade_status").eq("user_id", user.id),
      supabase.from("wants").select("card_id").eq("user_id", user.id),
      supabase
        .from("matches")
        .select("id, match_score")
        .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${id}),and(user_a_id.eq.${id},user_b_id.eq.${user.id})`)
        .maybeSingle(),
    ]);

  if (!collector) notFound();

  const iWant = new Set((myWants ?? []).map((w) => w.card_id));
  const iHave = new Set((myCollection ?? []).map((c) => c.card_id));
  const iTrade = new Set(
    (myCollection ?? []).filter((c) => c.trade_status === "available" || c.trade_status === "maybe").map((c) => c.card_id),
  );

  const name = collector.display_name;
  const memberSince = new Date(collector.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const haveList = haves ?? [];
  const wantList = wants ?? [];
  const overlapHaves = haveList.filter((h) => iWant.has(h.card.id)).length;
  const overlapWants = wantList.filter((w) => iHave.has(w.card.id)).length;

  return (
    <div>
      <header className="relative overflow-hidden rounded-xl bg-cover p-5 ring-1 ring-inset ring-line md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-5">
            <div className="grid size-24 shrink-0 place-items-center rounded-[28%] bg-page-2 ring-1 ring-inset ring-line-2 md:size-28">
              <Pocket crop="face" sleeve={sleeveFor(collector.id)} size={92} animate={false} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>
              <div className="mt-3">
                <IdentityBadge verified={collector.verified} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-2 md:ml-auto md:flex-col md:items-end md:text-right">
            {collector.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-muted" aria-hidden /> {collector.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank size={15} className="text-muted" aria-hidden /> Member since {memberSince}
            </span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {match ? (
            <ButtonLink href={`/matches/${match.id}`}>See your {Math.round(Number(match.match_score))}% match</ButtonLink>
          ) : (
            <span className="text-sm text-muted">
              No match yet.{" "}
              {overlapHaves > 0
                ? `${name} has ${overlapHaves} card${overlapHaves === 1 ? "" : "s"} you want. Mark something they want for trade to match.`
                : "Add cards to your wants to find trades with them."}
            </span>
          )}
        </div>
      </header>

      <section aria-label={`${name}'s cards for trade`} className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">Up for trade</h2>
          {overlapHaves > 0 && <span className="text-sm text-pear">{overlapHaves} on your want list</span>}
        </div>
        {haveList.length === 0 ? (
          <p className="mt-4 rounded-lg bg-page p-6 text-center text-muted ring-1 ring-inset ring-line">
            Nothing marked for trade yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 rounded-lg bg-page p-4 ring-1 ring-inset ring-line sm:grid-cols-4 md:p-6 lg:grid-cols-6">
            {haveList.map((h) => (
              <div key={h.id} className="min-w-0">
                <PocketSlot card={h.card} highlight={iWant.has(h.card.id)} tab={h.trade_status === "for_sale" ? "Sale" : "Trade"} />
                <CardCaption card={h.card} note={iWant.has(h.card.id) ? "You want this" : undefined} tone="pear" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-label={`${name}'s wants`} className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">Looking for</h2>
          {overlapWants > 0 && <span className="text-sm text-pear">You have {overlapWants} of these</span>}
        </div>
        {wantList.length === 0 ? (
          <p className="mt-4 rounded-lg bg-page p-6 text-center text-muted ring-1 ring-inset ring-line">No wants listed yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 rounded-lg bg-page p-4 ring-1 ring-inset ring-line sm:grid-cols-4 md:p-6 lg:grid-cols-6">
            {wantList.map((w) => (
              <div key={w.id} className="min-w-0">
                <EmptySlot card={w.card} lit={iHave.has(w.card.id)} />
                <CardCaption
                  card={w.card}
                  note={iTrade.has(w.card.id) ? "You have this for trade" : iHave.has(w.card.id) ? "In your binder" : undefined}
                  tone="pear"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
