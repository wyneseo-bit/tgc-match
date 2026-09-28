"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  FINISH_OPTIONS,
  categoryLabel,
  isFinish,
  type CardFilters as Filters,
  type FilterOptions,
  type SetInfo,
} from "@/lib/card-filters";

const CONTROL_STYLE = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border-strong)",
  colorScheme: "dark",
} as const;

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="h-10 max-w-[180px] rounded-btn px-3 text-[13px] outline-none focus:border-[#6C63FF80]"
      style={{
        ...CONTROL_STYLE,
        color: value ? "var(--color-text)" : "var(--color-muted)",
      }}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SetPicker({
  sets,
  value,
  onChange,
}: {
  sets: SetInfo[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const selected = sets.find((s) => s.id === value);
  const needle = text.trim().toLowerCase();
  const matches = sets
    .filter((s) => !needle || s.name.toLowerCase().includes(needle))
    .slice(0, 50);

  return (
    <div className="relative">
      <div
        className="flex h-10 w-[200px] items-center gap-1.5 rounded-btn px-3 focus-within:border-[#6C63FF80]"
        style={CONTROL_STYLE}
      >
        <input
          type="text"
          role="combobox"
          aria-label="Set"
          aria-expanded={open}
          aria-controls="set-picker-list"
          value={open ? text : (selected?.name ?? "")}
          placeholder="Any set"
          onFocus={() => {
            setText("");
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") e.currentTarget.blur();
          }}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-muted)]"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear set filter"
            onClick={() => onChange(undefined)}
            style={{ color: "var(--color-muted)" }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {open && (
        <ul
          id="set-picker-list"
          role="listbox"
          className="absolute left-0 top-11 z-20 max-h-64 w-[260px] overflow-y-auto rounded-btn py-1 text-[13px]"
          style={{ ...CONTROL_STYLE, boxShadow: "var(--shadow-card)" }}
        >
          {matches.length === 0 && (
            <li className="px-3 py-2" style={{ color: "var(--color-muted)" }}>
              No sets match
            </li>
          )}
          {matches.map((s) => (
            <li
              key={s.id}
              role="option"
              aria-selected={s.id === value}
              // mousedown (not click) so the input keeps focus long enough
              // for the pick to register before onBlur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.id);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 hover:bg-[var(--color-surface-2)]"
              style={{
                color:
                  s.id === value ? "var(--color-indigo-light)" : "var(--color-text)",
              }}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CardFilters({
  options,
  filters,
  onChange,
}: {
  options: FilterOptions;
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SetPicker
        sets={options.sets}
        value={filters.setId}
        onChange={(setId) => onChange({ ...filters, setId })}
      />
      <FilterSelect
        label="Rarity"
        value={filters.rarity}
        onChange={(rarity) => onChange({ ...filters, rarity })}
        options={options.rarities.map((r) => ({ value: r, label: r }))}
      />
      <FilterSelect
        label="Type"
        value={filters.type}
        onChange={(type) => onChange({ ...filters, type })}
        options={options.types.map((t) => ({ value: t, label: t }))}
      />
      <FilterSelect
        label="Category"
        value={filters.category}
        onChange={(category) => onChange({ ...filters, category })}
        options={options.categories.map((c) => ({
          value: c,
          label: categoryLabel(c),
        }))}
      />
      <FilterSelect
        label="Finish"
        value={filters.finish}
        onChange={(finish) =>
          onChange({
            ...filters,
            finish: finish && isFinish(finish) ? finish : undefined,
          })
        }
        options={FINISH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      />
      {active && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="px-1 text-[13px] font-medium"
          style={{ color: "var(--color-indigo-light)" }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
