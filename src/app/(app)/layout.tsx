import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, MobileTopBar, Sidebar } from "@/components/AppNav";

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
    <div className="room flex min-h-dvh">
      <Sidebar
        userId={user.id}
        displayName={profile?.display_name ?? user.email ?? "Trader"}
        verified={profile?.verified ?? false}
        matchCount={matchCount ?? 0}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:px-14 lg:pb-16">
          {children}
        </main>
      </div>
      <MobileNav matchCount={matchCount ?? 0} />
    </div>
  );
}
