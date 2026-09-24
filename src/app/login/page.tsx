"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { signIn } from "./actions";

const inputClass =
  "rounded-btn border border-border-strong px-3.5 py-2.5 text-sm text-text outline-none focus:border-[#6C63FF80] focus:shadow-[0_0_0_4px_rgba(108,99,255,0.1)]";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Mascot mood="curious" size={56} color="indigo" />
        <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
      </div>

      <div
        className="flex flex-col gap-4 rounded-card p-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className={inputClass}
            style={{ background: "var(--color-surface-2)" }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={6}
            className={inputClass}
            style={{ background: "var(--color-surface-2)" }}
          />

          {state?.error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="gradient-primary mt-1 rounded-btn py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm" style={{ color: "var(--color-muted)" }}>
        No account?{" "}
        <Link href="/signup" className="underline" style={{ color: "var(--color-text-2-body)" }}>
          Sign up
        </Link>
      </p>
    </main>
  );
}
