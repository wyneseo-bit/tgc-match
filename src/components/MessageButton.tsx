"use client";

import { useState, useTransition } from "react";
import { ChatCircle } from "@phosphor-icons/react";
import { startConversation } from "@/app/(app)/messages/actions";
import { buttonClass } from "./ui";

/** Opens the conversation with a collector (creating it if needed). */
export function MessageButton({
  userId,
  name,
  variant = "secondary",
  size = "md",
  className,
}: {
  userId: string;
  name: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            // Redirects to the thread on success.
            const r = await startConversation(userId);
            if (r?.error) setError(r.error);
          })
        }
        className={buttonClass(variant, size, "w-full")}
      >
        <ChatCircle size={18} aria-hidden /> {pending ? "Opening…" : `Message ${name}`}
      </button>
      {error && <p className="mt-1.5 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
