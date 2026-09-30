"use client";

import { cx } from "./ui";

/** Compact filter pills. Selected = pear tint, unselected = dark surface + hairline. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (v: T) => void;
  label: string;
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected(o.value)}
          onClick={() => onChange(o.value)}
          className={cx(
            "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-150",
            selected(o.value)
              ? "bg-pear text-pear-ink"
              : "bg-page text-fg-2 ring-1 ring-inset ring-line-2 hover:bg-page-2 hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
