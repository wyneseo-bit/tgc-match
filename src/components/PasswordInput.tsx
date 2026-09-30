"use client";

import { useState } from "react";
import { Check, Eye, EyeSlash, LockSimple } from "@phosphor-icons/react";
import { fieldShell } from "./AuthField";

export function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  error,
  value,
  onChange,
  showCheck,
  label,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  error?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  showCheck?: boolean;
  label?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={fieldShell(error)}>
      <LockSimple size={18} className="shrink-0 text-muted" aria-hidden />
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-label={label}
        aria-invalid={error || undefined}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
      />
      {showCheck ? (
        <Check size={18} weight="bold" className="shrink-0 text-pear" aria-label="Passwords match" />
      ) : (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-muted hover:text-fg"
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <EyeSlash size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      )}
    </div>
  );
}
