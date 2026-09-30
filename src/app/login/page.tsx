"use client";

import { useActionState } from "react";
import Link from "next/link";
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react";
import { AuthField } from "@/components/AuthField";
import { AuthShell, OrDivider } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <AuthShell
      expression="excited"
      title={
        <>
          Welcome back,
          <br />
          collector.
        </>
      }
      body="Your binder kept looking for trades while you were away."
      topRight={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-pear hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Log in</h1>
          <p className="mt-1.5 text-muted">Pick up where you left off.</p>
        </div>

        <GoogleButton />
        <OrDivider />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fg-2">Email</span>
            <AuthField
              icon={EnvelopeSimple}
              name="email"
              type="email"
              label="Email"
              placeholder="you@email.com"
              required
              defaultValue={state?.email ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-fg-2">Password</span>
              <Link href="/forgot-password" className="text-sm font-medium text-pear hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              label="Password"
              placeholder="••••••••"
              required
              minLength={6}
              error={!!state?.error}
            />
            {state?.error && <span className="text-xs text-danger">{state.error}</span>}
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-fg-2">
          <input type="checkbox" name="rememberMe" defaultChecked className="size-[18px] rounded accent-pear" />
          Keep me logged in on this device
        </label>

        <Button type="submit" size="lg" disabled={pending} className="w-full text-[15px]">
          {pending ? "Logging in…" : "Log in"}
        </Button>

        <span className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <LockSimple size={13} aria-hidden />
          We&apos;ll never ask for your password in a message.
        </span>
      </form>
    </AuthShell>
  );
}
