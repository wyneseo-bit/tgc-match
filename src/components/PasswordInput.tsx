"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  name,
  placeholder,
  required,
  minLength,
  className,
  style,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={`w-full pr-10 ${className ?? ""}`}
        style={style}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "var(--color-muted)" }}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}
