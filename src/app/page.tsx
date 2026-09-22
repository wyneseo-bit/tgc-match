import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">TCG Trade Matcher</h1>
      <p className="max-w-md text-zinc-600">
        List what you HAVE and what you WANT — we match reciprocal trades
        automatically.
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-500">Signed in as {user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Log out
            </button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded border border-black px-4 py-2"
          >
            Log in
          </Link>
          <Link href="/signup" className="rounded bg-black px-4 py-2 text-white">
            Sign up
          </Link>
        </div>
      )}
    </main>
  );
}
