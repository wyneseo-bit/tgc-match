"use client";

import { useState } from "react";
import { revealContact } from "./actions";

export function ContactReveal({ matchId }: { matchId: string }) {
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
      <p className="mt-3 text-sm">
        Contact:{" "}
        <a href={`mailto:${email}`} className="underline">
          {email}
        </a>
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleReveal}
        disabled={status === "loading"}
        className="rounded border border-black px-2 py-1 text-xs disabled:opacity-50"
      >
        {status === "loading" ? "Loading…" : "Reveal contact"}
      </button>
      {status === "error" && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
