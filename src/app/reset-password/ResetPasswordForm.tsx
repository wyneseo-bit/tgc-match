"use client";

import { useActionState, useState } from "react";
import { Key } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordRules, passwordMeetsRules } from "@/components/PasswordRules";
import { Button } from "@/components/ui";
import { updatePassword } from "./actions";

export function ResetPasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const rulesMet = passwordMeetsRules(password);
  const matches = confirm.length > 0 && confirm === password;
  const canSubmit = rulesMet && matches;

  return (
    <main className="room flex min-h-dvh flex-col px-4 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto w-full max-w-[620px]">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <span className="grid size-12 place-items-center rounded-md bg-page text-pear ring-1 ring-inset ring-line-2">
            <Key size={22} weight="bold" aria-hidden />
          </span>

          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1.5 text-muted">For {email}</p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-2">New password</span>
              <PasswordInput
                name="password"
                label="New password"
                placeholder="••••••••••••"
                required
                value={password}
                onChange={setPassword}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-2">Confirm password</span>
              <PasswordInput
                name="confirmPassword"
                label="Confirm password"
                placeholder="••••••••••••"
                required
                value={confirm}
                onChange={setConfirm}
                showCheck={matches}
              />
            </div>

            <PasswordRules password={password} />

            {state?.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button type="submit" size="lg" disabled={pending || !canSubmit} className="mt-2 w-full text-[15px]">
              {pending ? "Saving…" : "Update password"}
            </Button>

            <span className="text-center text-xs text-muted">You&apos;ll be logged out on all other devices.</span>
          </form>
        </div>
      </div>
    </main>
  );
}
