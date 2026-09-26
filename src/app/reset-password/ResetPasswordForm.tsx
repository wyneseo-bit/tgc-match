"use client";

import { useActionState, useState } from "react";
import { Key } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRules, passwordMeetsRules } from "@/components/PasswordRules";
import { updatePassword } from "./actions";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rulesMet = passwordMeetsRules(password);
  const matches = confirm.length > 0 && confirm === password;
  const canSubmit = rulesMet && matches;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="flex items-center gap-2.5">
        <Mascot mood="curious" size={26} color="indigo" />
        <span className="text-[15px] font-bold">TCG Trade Matcher</span>
      </div>

      <div className="flex flex-col gap-6">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-btn"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
        >
          <Key size={20} strokeWidth={2} color="var(--color-indigo-light)" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-bold tracking-tight">Set a new password</h1>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            For {email}
          </span>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
              New password
            </span>
            <PasswordInput
              name="password"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium" style={{ color: "var(--color-text-2-body)" }}>
              Confirm password
            </span>
            <PasswordInput
              name="confirmPassword"
              placeholder="••••••••••••"
              required
              value={confirm}
              onChange={setConfirm}
              showCheck={matches}
            />
          </div>

          <PasswordRules password={password} />

          {state?.error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="gradient-primary flex h-12 items-center justify-center rounded-btn text-[15px] font-medium text-white disabled:opacity-50"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            {pending ? "Saving…" : "Update Password"}
          </button>

          <span className="text-center text-xs" style={{ color: "var(--color-muted)" }}>
            You&apos;ll be logged out on all other devices.
          </span>
        </form>
      </div>
    </main>
  );
}
