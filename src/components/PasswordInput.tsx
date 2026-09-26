"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Check } from "lucide-react";

export function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  error,
  value,
  onChange,
  showCheck,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  error?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  showCheck?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="flex h-12 items-center gap-2.5 rounded-btn px-3.5 focus-within:border-[#6C63FF80] focus-within:shadow-[0_0_0_4px_rgba(108,99,255,0.1)]"
      style={{
        background: "var(--color-surface)",
        border: error ? "1px solid rgba(255,107,107,0.6)" : "1px solid var(--color-border-strong)",
        boxShadow: error ? "0 0 0 4px rgba(255,107,107,0.08)" : undefined,
      }}
    >
      <Lock size={16} strokeWidth={2} color="var(--color-muted)" />
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
      />
      {showCheck ? (
        <Check size={16} strokeWidth={2} color="var(--color-cyan)" />
      ) : (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex-none"
          style={{ color: "var(--color-muted)" }}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
        </button>
      )}
    </div>
  );
}
