"use client";

import { useState, useTransition } from "react";
import { GoogleLogo } from "@phosphor-icons/react";
import { signInWithGoogle } from "@/app/login/actions";
import { buttonClass } from "./ui";

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
        className={buttonClass("secondary", "lg", "w-full text-[15px]")}
      >
        <GoogleLogo size={18} weight="bold" aria-hidden />
        {pending ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
