"use client";

import { useState, useTransition } from "react";
import { signInWithGoogle } from "@/app/login/actions";

export function GoogleButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="flex h-12 items-center justify-center gap-2.5 rounded-btn text-sm font-medium disabled:opacity-50"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)" }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--color-text)", color: "var(--color-bg)" }}
        >
          G
        </span>
        Continue with Google
      </button>
      {error && (
        <span className="text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
