"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, EnvelopeSimple } from "@phosphor-icons/react";
import { AuthField } from "@/components/AuthField";
import { Logo } from "@/components/Logo";
import { Pocket } from "@/components/Pocket";
import { Button, buttonClass } from "@/components/ui";
import { requestPasswordReset } from "../login/actions";

const RESEND_SECONDS = 45;

function ResendCountdown({
  onResend,
  pending,
}: {
  onResend: () => void;
  pending: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  if (secondsLeft > 0) {
    const mm = Math.floor(secondsLeft / 60);
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return (
      <span className="flex items-center justify-center gap-1.5">
        <Clock size={14} aria-hidden />
        Resend in{" "}
        <span className="font-mono text-fg-2">
          {mm}:{ss}
        </span>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        onResend();
        setSecondsLeft(RESEND_SECONDS);
      }}
      className="font-medium text-pear hover:underline disabled:opacity-50"
    >
      {pending ? "Resending…" : "Resend"}
    </button>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="room flex min-h-dvh flex-col px-4 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto flex w-full max-w-[620px] items-center justify-between">
        <Link href="/login" className="-ml-1 inline-flex h-11 items-center gap-2 px-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={16} aria-hidden /> Back to log in
        </Link>
        <Logo compact />
      </div>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">{children}</div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <Frame>
        <Pocket expression="excited" prop="card" size={120} />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Check your inbox</h1>
          <p className="mt-2 leading-relaxed text-muted">
            We sent a reset link to <span className="font-medium text-fg">{state.email}</span>. Click it to continue.
          </p>
        </div>

        <a href="mailto:" className={buttonClass("secondary", "lg", "w-full text-[15px]")}>
          Open email app
        </a>

        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <span>Didn&apos;t get it? Check spam, or</span>
          <ResendCountdown
            pending={pending}
            onResend={() => {
              const fd = new FormData();
              fd.set("email", state.email ?? "");
              formAction(fd);
            }}
          />
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <form action={formAction} className="flex w-full flex-col items-center gap-6">
        <Pocket expression="thinking" size={120} />

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-2 leading-relaxed text-muted">
            It happens. Enter the email on your account and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 text-left">
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

        {state?.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" size="lg" disabled={pending} className="w-full text-[15px]">
          {pending ? "Sending…" : "Send reset link"}
        </Button>

        <span className="text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-pear hover:underline">
            Log in
          </Link>
        </span>
      </form>
    </Frame>
  );
}
