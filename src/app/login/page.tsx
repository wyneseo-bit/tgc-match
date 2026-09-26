"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { AuthField } from "@/components/AuthField";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleButton } from "@/components/GoogleButton";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[560px_minmax(0,1fr)]">
      {/* Brand panel */}
      <div
        className="relative hidden flex-col overflow-hidden border-r border-border p-10 lg:flex"
        style={{
          background:
            "radial-gradient(500px 400px at 40% 55%, rgba(108,99,255,0.28), transparent 65%), radial-gradient(300px 240px at 10% 90%, rgba(255,138,122,0.08), transparent 70%), var(--color-bg-2)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Mascot mood="curious" size={30} color="indigo" />
          <span className="text-base font-bold tracking-tight">TCG Trade Matcher</span>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-[150px] top-[110px]">
            <Mascot mood="searching" size={200} color="indigo" />
          </div>
          <div
            className="glass absolute left-9 top-[70px] flex w-[230px] items-center gap-3 rounded-card p-4"
            style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
          >
            <span className="gradient-text text-[26px] font-bold tracking-tight">3</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold">new matches</span>
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                since you last visited
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Welcome back,
            <br />
            collector.
          </h2>
          <p className="max-w-[400px] text-[15px] leading-relaxed" style={{ color: "var(--color-text-nav)" }}>
            Your matches have been busy while you were away.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col p-8 sm:p-12">
        <div className="flex justify-end gap-1.5 text-sm" style={{ color: "var(--color-muted)" }}>
          New here?
          <Link href="/signup" className="font-medium" style={{ color: "var(--color-indigo-light)" }}>
            Create an account
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <form action={formAction} className="flex w-full max-w-[400px] flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[30px] font-bold tracking-tight">Log in</h1>
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                Pick up where you left off.
              </span>
            </div>

            <GoogleButton />

            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
              <span className="h-px flex-1" style={{ background: "var(--color-border-strong)" }} />
              or
              <span className="h-px flex-1" style={{ background: "var(--color-border-strong)" }} />
            </div>

            <div className="flex flex-col gap-4">
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
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
                    Password
                  </span>
                  <Link href="/forgot-password" className="text-[13px] font-medium" style={{ color: "var(--color-indigo-light)" }}>
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  error={!!state?.error}
                />
                {state?.error && (
                  <span className="text-xs" style={{ color: "var(--color-danger)" }}>
                    {state.error}
                  </span>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--color-text-nav)" }}>
              <input
                type="checkbox"
                name="rememberMe"
                defaultChecked
                className="h-[18px] w-[18px] rounded"
                style={{ accentColor: "var(--color-indigo)" }}
              />
              Keep me logged in on this device
            </label>

            <button
              type="submit"
              disabled={pending}
              className="gradient-primary flex h-12 items-center justify-center rounded-btn text-[15px] font-medium text-white disabled:opacity-50"
              style={{ boxShadow: "var(--shadow-cta)" }}
            >
              {pending ? "Logging in…" : "Log In"}
            </button>

            <span className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
              <Lock size={13} strokeWidth={2} />
              We&apos;ll never ask for your password in a message.
            </span>
          </form>
        </div>
      </div>
    </main>
  );
}
