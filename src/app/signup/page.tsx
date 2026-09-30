"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react";
import { AuthField } from "@/components/AuthField";
import { AuthShell, OrDivider } from "@/components/AuthShell";
import { GoogleButton } from "@/components/GoogleButton";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength } from "@/components/PasswordStrength";
import { Pocket } from "@/components/Pocket";
import { Button, ButtonLink, fieldClass } from "@/components/ui";
import { signUp } from "../login/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);
  const [password, setPassword] = useState("");

  if (state?.needsConfirmation) {
    return (
      <main className="room grid min-h-dvh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center text-center">
          <Pocket expression="celebrating" prop="card" size={130} />
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-3 text-muted">
            We&apos;ve sent a confirmation link to your email. Click it to activate your account, then log in.
          </p>
          <ButtonLink href="/login" variant="secondary" className="mt-8">
            Back to log in
          </ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <AuthShell
      expression="celebrating"
      title={
        <>
          Your binder is about
          <br />
          to get busier.
        </>
      }
      body="List what you have and what you want. We'll find the collectors you can trade with."
      topRight={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-pear hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1.5 text-muted">Free to join. Takes less than a minute.</p>
        </div>

        <GoogleButton />
        <OrDivider>or with email</OrDivider>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="displayName" className="text-sm font-medium text-fg-2">
              Collector name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="aisyah.collects"
              required
              defaultValue={state?.displayName ?? ""}
              className={fieldClass()}
            />
            <span className="text-xs text-muted">Shown on your profile and trades.</span>
          </div>

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
            <span className="text-sm font-medium text-fg-2">Password</span>
            <PasswordInput
              name="password"
              label="Password"
              placeholder="••••••••"
              required
              minLength={6}
              value={password}
              onChange={setPassword}
            />
            <PasswordStrength password={password} />
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm leading-relaxed text-fg-2">
          <input type="checkbox" required className="mt-0.5 size-[18px] shrink-0 rounded accent-pear" />
          I agree to the Terms and Trading Rules, and I&apos;m 18 or older.
        </label>

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" size="lg" disabled={pending} className="w-full text-[15px]">
          {pending ? "Creating account…" : "Create account"}
        </Button>

        <span className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck size={14} className="shrink-0 text-seal" aria-hidden />
          You&apos;ll only be asked to verify your identity before your first trade.
        </span>
      </form>
    </AuthShell>
  );
}
