"use client";

import { useState } from "react";
import { revealContact } from "./actions";

export function ContactReveal({ matchId, featured }: { matchId: string; featured: boolean }) {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleReveal() {
    setStatus("loading");
    const result = await revealContact(matchId);

    if (result.error) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setEmail(result.email ?? "No email on file");
    setStatus("idle");
  }

  if (email) {
    return (
      <a
        href={`mailto:${email}`}
        className="max-w-32 truncate text-xs underline"
        style={{ color: "var(--color-cyan)" }}
        title={email}
      >
        {email}
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleReveal}
        disabled={status === "loading"}
        className={
          featured
            ? "gradient-primary flex h-9 items-center rounded-btn px-3.5 text-[13px] font-medium text-white disabled:opacity-50"
            : "flex h-9 items-center rounded-btn border border-border-strong px-3.5 text-[13px] font-medium disabled:opacity-50"
        }
        style={!featured ? { background: "var(--color-surface-2)" } : undefined}
      >
        {status === "loading" ? "Loading…" : "Reveal contact"}
      </button>
      {status === "error" && (
        <p className="text-[11px]" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
