import type { Icon } from "@phosphor-icons/react";
import { cx } from "./ui";

/** The wrapper look shared by every auth input: page surface, pear focus ring. */
export function fieldShell(error?: boolean) {
  return cx(
    "flex h-12 items-center gap-2.5 rounded-md bg-page px-4 ring-1 ring-inset transition focus-within:bg-page-2",
    error
      ? "ring-danger/60 shadow-[0_0_0_4px_rgb(255_114_114/0.08)]"
      : "ring-line-2 focus-within:shadow-[0_0_0_4px_rgb(212_242_106/0.12)] focus-within:ring-pear/70",
  );
}

export function AuthField({
  icon: FieldIcon,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  error,
  label,
}: {
  icon: Icon;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  error?: boolean;
  /** Accessible name when the visible label isn't a <label> for this input. */
  label?: string;
}) {
  return (
    <div className={fieldShell(error)}>
      <FieldIcon size={18} className="shrink-0 text-muted" aria-hidden />
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        aria-label={label}
        aria-invalid={error || undefined}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted"
      />
    </div>
  );
}
