"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { cx, selectClass } from "@/components/ui";
import {
  FINISH_OPTIONS,
  categoryLabel,
  isFinish,
  type CardFilters as Filters,
  type FilterOptions,
  type SetInfo,
} from "@/lib/card-filters";

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
      className={cx(
        selectClass,
        "max-w-[180px] px-4",
        value ? "bg-pear/12 text-pear ring-pear/40" : "text-fg-2",
      )}
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
        className={cx(
          "flex h-9 w-[200px] items-center gap-1.5 rounded-full px-4 ring-1 ring-inset transition focus-within:ring-pear/70",
          value ? "bg-pear/12 ring-pear/40" : "bg-page-2 ring-line-2",
        )}
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
          className={cx("min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted", value && !open ? "text-pear" : "text-fg")}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear set filter"
            onClick={() => onChange(undefined)}
            className="text-muted hover:text-fg"
          >
            <X size={14} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <ul
          id="set-picker-list"
          role="listbox"
          className="glass absolute left-0 top-11 z-20 max-h-64 w-[260px] overflow-y-auto rounded-md py-1 text-sm"
        >
          {matches.length === 0 && (
            <li className="px-3 py-2 text-muted">
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
              className={cx(
                "cursor-pointer px-3 py-2 hover:bg-white/5",
                s.id === value ? "text-pear" : "text-fg",
              )}
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
          className="h-9 px-2 text-sm font-medium text-pear hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
