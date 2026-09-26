import type { LucideIcon } from "lucide-react";

export function AuthField({
  icon: Icon,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  error,
}: {
  icon: LucideIcon;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  error?: boolean;
}) {
  return (
    <div
      className="flex h-12 items-center gap-2.5 rounded-btn px-3.5 focus-within:border-[#6C63FF80] focus-within:shadow-[0_0_0_4px_rgba(108,99,255,0.1)]"
      style={{
        background: "var(--color-surface)",
        border: error ? "1px solid rgba(255,107,107,0.6)" : "1px solid var(--color-border-strong)",
        boxShadow: error ? "0 0 0 4px rgba(255,107,107,0.08)" : undefined,
      }}
    >
      <Icon size={16} strokeWidth={2} color="var(--color-muted)" />
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted)]"
      />
    </div>
  );
}
