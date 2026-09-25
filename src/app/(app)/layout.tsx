import { redirect } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: matchCount }] = await Promise.all([
    supabase.from("users").select("display_name, verified").eq("id", user.id).single(),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
  ]);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar
          displayName={profile?.display_name ?? user.email ?? "Trader"}
          verified={profile?.verified ?? false}
          matchCount={matchCount ?? 0}
        />
      </div>
      <div className="ambient-bg flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-border px-4 py-4 sm:px-10">
          <div
            className="hidden h-11 max-w-[520px] flex-1 items-center gap-2.5 rounded-btn px-3.5 sm:flex"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <Search size={17} strokeWidth={2} color="var(--color-muted)" />
            <span className="text-sm" style={{ color: "var(--color-muted)" }}>
              Search cards, sets or collectors…
            </span>
          </div>
          <div className="flex-1" />
          <div
            className="relative flex h-11 w-11 flex-none items-center justify-center rounded-btn border border-border"
            style={{ background: "var(--color-surface)" }}
          >
            <Bell size={18} strokeWidth={2} color="var(--color-text-2-body)" />
            <span
              className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-coral)" }}
            />
          </div>
        </div>
        <div className="flex-1 px-4 py-8 pb-28 sm:px-10 sm:py-10 md:pb-10">{children}</div>
      </div>
      <MobileNav matchCount={matchCount ?? 0} />
    </div>
  );
}
