"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Clock } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { AuthField } from "@/components/AuthField";
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
        <Clock size={13} strokeWidth={2} />
        Resend in{" "}
        <span className="font-mono" style={{ color: "var(--color-text-2-body)" }}>
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
      className="font-medium underline disabled:opacity-50"
      style={{ color: "var(--color-indigo-light)" }}
    >
      {pending ? "Resending…" : "Resend"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <main
        className="mx-auto flex min-h-screen max-w-[620px] flex-col px-10 py-8"
        style={{
          background:
            "radial-gradient(420px 300px at 50% 18%, rgba(66,217,232,0.12), transparent 70%)",
        }}
      >
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-nav)" }}>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to log in
          </Link>
          <Mascot mood="curious" size={26} color="indigo" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">
            <div
              className="flex h-22 w-22 items-center justify-center rounded-full"
              style={{ background: "var(--color-cyan-tint)", boxShadow: "inset 0 0 0 1px rgba(66,217,232,0.3)" }}
            >
              <Mail size={36} strokeWidth={1.8} color="var(--color-cyan)" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[30px] font-bold tracking-tight">Check your inbox</h1>
              <span className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                We sent a reset link to{" "}
                <span className="font-medium" style={{ color: "var(--color-text)" }}>
                  {state.email}
                </span>
                . Click it to continue.
              </span>
            </div>

            <a
              href="mailto:"
              className="flex h-12 w-full items-center justify-center rounded-btn text-[15px] font-medium"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
            >
              Open Email App
            </a>

            <div className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--color-muted)" }}>
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto flex min-h-screen max-w-[620px] flex-col px-10 py-8"
      style={{
        background:
          "radial-gradient(420px 300px at 50% 18%, rgba(108,99,255,0.18), transparent 70%)",
      }}
    >
      <div className="flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-nav)" }}>
          <ArrowLeft size={16} strokeWidth={2} />
          Back to log in
        </Link>
        <Mascot mood="curious" size={26} color="indigo" />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <form action={formAction} className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">
          <Mascot mood="thinking" size={120} color="indigo" />

          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-bold tracking-tight">Forgot your password?</h1>
            <span className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
              It happens. Enter the email on your account and we&apos;ll send you a
              reset link.
            </span>
          </div>

          <div className="flex w-full flex-col gap-2 text-left">
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

          {state?.error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="gradient-primary flex h-12 w-full items-center justify-center rounded-btn text-[15px] font-medium text-white disabled:opacity-50"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            {pending ? "Sending…" : "Send Reset Link"}
          </button>

          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Remembered it?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--color-indigo-light)" }}>
              Log in
            </Link>
          </span>
        </form>
      </div>
    </main>
  );
}
