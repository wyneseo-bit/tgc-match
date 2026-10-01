import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, MobileTopBar, Sidebar } from "@/components/AppNav";
import { CONVERSATION_COLUMNS, isUnread, type ConversationRow } from "@/lib/messages";
import { needsMyAction, OPEN_STATUSES, TRADE_COLUMNS, type Trade } from "@/lib/trades";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Badge counts. RLS scopes every query to the caller's own rows.
  const [{ data: profile }, { count: matchCount }, { count: unreadNotifications }, { data: conversations }, { data: openTrades }] = await Promise.all([
    supabase.from("users").select("display_name, verified").eq("id", user.id).single(),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("conversations").select(CONVERSATION_COLUMNS).returns<ConversationRow[]>(),
    supabase.from("trades").select(TRADE_COLUMNS).in("status", OPEN_STATUSES).returns<Trade[]>(),
  ]);

  const badges = {
    matches: matchCount ?? 0,
    notifications: unreadNotifications ?? 0,
    messages: (conversations ?? []).filter((c) => isUnread(c, user.id)).length,
    trades: (openTrades ?? []).filter((t) => needsMyAction(t, user.id)).length,
  };

  return (
    <div className="room flex min-h-dvh">
      <Sidebar
        userId={user.id}
        displayName={profile?.display_name ?? user.email ?? "Trader"}
        verified={profile?.verified ?? false}
        badges={badges}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar userId={user.id} badges={badges} />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:px-14 lg:pb-16">
          {children}
        </main>
      </div>
      <MobileNav badges={badges} />
    </div>
  );
}
