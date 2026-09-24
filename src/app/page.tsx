import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Mascot } from "@/components/Mascot";
import { signOut } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="ambient-bg mx-auto flex min-h-screen max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <Mascot mood={user ? "excited" : "curious"} size={90} color="indigo" />

      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="gradient-text">TCG Trade Matcher</span>
        </h1>
        <p className="max-w-md text-base" style={{ color: "var(--color-muted)" }}>
          List what you HAVE and what you WANT — we match reciprocal trades
          automatically.
        </p>
      </div>

      {user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Signed in as {user.email}
          </p>
          <Link
            href="/matches"
            className="gradient-primary rounded-btn px-6 py-3 text-sm font-medium text-white"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            Find Matches
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-sm underline" style={{ color: "var(--color-muted)" }}>
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-btn border border-border-strong px-5 py-2.5 text-sm font-medium"
            style={{ background: "var(--color-surface)" }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="gradient-primary rounded-btn px-5 py-2.5 text-sm font-medium text-white"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            Find Matches
          </Link>
        </div>
      )}
    </main>
  );
}
