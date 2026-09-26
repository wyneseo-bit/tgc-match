"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, Shield } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { AuthField } from "@/components/AuthField";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength } from "@/components/PasswordStrength";
import { GoogleButton } from "@/components/GoogleButton";
import { TcgCard } from "@/components/TcgCard";
import { signUp } from "../login/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);
  const [password, setPassword] = useState("");

  if (state?.needsConfirmation) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 text-center">
        <div
          className="flex h-22 w-22 items-center justify-center rounded-full"
          style={{ background: "var(--color-cyan-tint)", boxShadow: "inset 0 0 0 1px rgba(66,217,232,0.3)" }}
        >
          <Mail size={36} strokeWidth={1.8} color="var(--color-cyan)" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            We&apos;ve sent a confirmation link to your email. Click it to activate
            your account, then log in.
          </p>
        </div>
        <Link href="/login" className="text-sm underline" style={{ color: "var(--color-text-2-body)" }}>
          Back to log in
        </Link>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[560px_minmax(0,1fr)]">
      {/* Brand panel */}
      <div
        className="relative hidden flex-col overflow-hidden border-r border-border p-10 lg:flex"
        style={{
          background:
            "radial-gradient(500px 400px at 40% 55%, rgba(108,99,255,0.28), transparent 65%), radial-gradient(300px 240px at 90% 90%, rgba(66,217,232,0.10), transparent 70%), var(--color-bg-2)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Mascot mood="curious" size={30} color="indigo" />
          <span className="text-base font-bold tracking-tight">TCG Trade Matcher</span>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-6 top-[90px] -rotate-[10deg]">
            <TcgCard width={116} tone="violet" alt="" name="Mew ex" code="205" />
          </div>
          <div className="absolute right-5 top-15 rotate-[9deg]">
            <TcgCard width={108} tone="yellow" alt="" name="Monkey.D.Luffy" code="OP05" />
          </div>
          <div className="absolute left-[140px] top-[130px]">
            <Mascot mood="excited" size={200} color="indigo" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Your binder is about
            <br />
            to get busier.
          </h2>
          <p className="max-w-[400px] text-[15px] leading-relaxed" style={{ color: "var(--color-text-nav)" }}>
            List what you have and what you want. We&apos;ll find the collectors
            you can trade with.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col p-8 sm:p-12">
        <div className="flex justify-end gap-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
          Already have an account?
          <Link href="/login" className="font-medium" style={{ color: "var(--color-indigo-light)" }}>
            Log in
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <form action={formAction} className="flex w-full max-w-[400px] flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[30px] font-bold tracking-tight">Create your account</h1>
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                Free to join. Takes less than a minute.
              </span>
            </div>

            <GoogleButton />

            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
              <span className="h-px flex-1" style={{ background: "var(--color-border-strong)" }} />
              or with email
              <span className="h-px flex-1" style={{ background: "var(--color-border-strong)" }} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
                  Collector name
                </span>
                <input
                  name="displayName"
                  type="text"
                  placeholder="aisyah.collects"
                  required
                  defaultValue={state?.displayName ?? ""}
                  className="flex h-12 items-center rounded-btn px-3.5 text-sm outline-none focus:border-[#6C63FF80] focus:shadow-[0_0_0_4px_rgba(108,99,255,0.1)]"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
                />
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                  Shown on your profile and trades.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
                  Email
                </span>
                <AuthField
                  icon={Mail}
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                  required
                  defaultValue={state?.email ?? ""}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
                  Password
                </span>
                <PasswordInput
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={password}
                  onChange={setPassword}
                />
                <PasswordStrength password={password} />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--color-text-nav)" }}>
              <input
                type="checkbox"
                required
                className="mt-0.5 h-[18px] w-[18px] flex-none rounded"
                style={{ accentColor: "var(--color-indigo)" }}
              />
              I agree to the Terms and Trading Rules, and I&apos;m 18 or older.
            </label>

            {state?.error && (
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="gradient-primary flex h-12 items-center justify-center rounded-btn text-[15px] font-medium text-white disabled:opacity-50"
              style={{ boxShadow: "var(--shadow-cta)" }}
            >
              {pending ? "Creating account…" : "Create Account"}
            </button>

            <span className="flex items-center justify-center gap-1.5 text-center text-xs" style={{ color: "var(--color-muted)" }}>
              <Shield size={13} strokeWidth={2} />
              You&apos;ll only be asked to verify your identity before your first trade.
            </span>
          </form>
        </div>
      </div>
    </main>
  );
}
