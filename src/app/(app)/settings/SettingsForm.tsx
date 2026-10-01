"use client";

import { useActionState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { Button, fieldClass } from "@/components/ui";
import { updateProfile } from "./actions";

export function SettingsForm({ displayName, location }: { displayName: string; location: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-6 rounded-lg bg-page p-5 ring-1 ring-inset ring-line md:p-7">
      <h2 className="font-display text-xl font-semibold tracking-tight">Profile</h2>

      <div className="grid gap-2">
        <label htmlFor="displayName" className="text-sm font-medium text-fg-2">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={40}
          defaultValue={state?.displayName ?? displayName}
          className={fieldClass()}
        />
        <p className="text-sm text-muted">Shown on your profile, matches and trades.</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="location" className="text-sm font-medium text-fg-2">
          Location
        </label>
        <input
          id="location"
          name="location"
          maxLength={80}
          placeholder="e.g. Petaling Jaya"
          defaultValue={state?.location ?? location}
          className={fieldClass()}
        />
        <p className="text-sm text-muted">A city or area is enough. It helps collectors plan a meetup.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {state?.error && <span className="text-danger">{state.error}</span>}
          {state?.saved && !pending && (
            <span className="inline-flex items-center gap-1.5 text-pear">
              <CheckCircle size={16} weight="fill" aria-hidden /> Saved
            </span>
          )}
        </span>
      </div>
    </form>
  );
}
