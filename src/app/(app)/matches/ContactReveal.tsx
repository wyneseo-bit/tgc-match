"use client";

import { useState } from "react";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui";
import { revealContact } from "./actions";

export function ContactReveal({
  matchId,
  size = "md",
  variant = "secondary",
  className,
}: {
  matchId: string;
  size?: "md" | "lg";
  variant?: "primary" | "secondary";
  className?: string;
}) {
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
        className={buttonClass("secondary", size, `min-w-0 ${className ?? ""}`)}
        title={email}
      >
        <EnvelopeSimple size={16} className="shrink-0 text-seal" aria-hidden />
        <span className="truncate">{email}</span>
      </a>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleReveal}
        disabled={status === "loading"}
        className={buttonClass(variant, size, "w-full")}
      >
        {status === "loading" ? "Loading…" : "Reveal contact"}
      </button>
      {status === "error" && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
