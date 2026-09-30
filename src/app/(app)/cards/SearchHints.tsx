"use client";

import { X } from "@phosphor-icons/react";
import type { IgnoreKey, SearchInterpretation } from "@/lib/card-filters";

function Chip({
  label,
  value,
  onRemove,
  removeLabel,
}: {
  label: string;
  value: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="flex h-8 items-center gap-1.5 rounded-full bg-pear/12 pl-3 pr-1.5 text-xs font-medium text-pear ring-1 ring-inset ring-pear/30">
      <span className="text-muted">{label}</span>
      {value}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="grid size-6 place-items-center rounded-full hover:bg-pear/15"
      >
        <X size={12} weight="bold" aria-hidden />
      </button>
    </span>
  );
}

function LinkButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-medium text-pear underline-offset-4 hover:underline"
    >
      {children}
    </button>
  );
}

export function SearchHints({
  query,
  interpretation,
  ignore,
  onToggle,
  onReset,
}: {
  query: string;
  interpretation: SearchInterpretation;
  ignore: IgnoreKey[];
  onToggle: (key: IgnoreKey) => void;
  onReset: () => void;
}) {
  const { sets, number, printedTotal, delta, corrections, searchedName } =
    interpretation;
  const spellingOff = ignore.includes("typo");
  const hasChips = sets.length > 0 || number !== null;
  const hasDeltaNote = delta !== null || ignore.includes("delta");

  if (!hasChips && !hasDeltaNote && corrections.length === 0 && ignore.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {corrections.length > 0 && (
        <p className="text-sm text-fg-2">
          Showing results for{" "}
          <span className="font-semibold text-fg">
            {searchedName}
          </span>
          . <LinkButton onClick={() => onToggle("typo")}>Search instead for &quot;{query.trim()}&quot;</LinkButton>
        </p>
      )}
      {spellingOff && (
        <p className="text-xs text-muted">
          Searching exactly as typed.{" "}
          <LinkButton onClick={() => onToggle("typo")}>Fix spelling</LinkButton>
        </p>
      )}

      {(hasChips || hasDeltaNote) && (
        <div className="flex flex-wrap items-center gap-2">
          {sets.length > 0 && (
            <Chip
              label="Set"
              value={sets.map((s) => s.name).join(" + ")}
              removeLabel="Don't filter by this set"
              onRemove={() => onToggle("set")}
            />
          )}
          {number !== null && (
            <Chip
              label="Card"
              value={`#${number}${printedTotal ? `/${printedTotal}` : ""}`}
              removeLabel="Don't filter by card number"
              onRemove={() => onToggle("number")}
            />
          )}
          {delta === "marker" && (
            <>
              <span className="flex h-8 items-center rounded-full bg-pear/12 px-3 text-xs font-medium text-pear ring-1 ring-inset ring-pear/30">
                δ Delta cards
              </span>
              <LinkButton onClick={() => onToggle("delta")}>
                Search the Delta Species set instead
              </LinkButton>
            </>
          )}
          {delta === "set" && (
            <LinkButton onClick={() => onToggle("delta")}>
              Search δ Delta cards instead
            </LinkButton>
          )}
        </div>
      )}

      {ignore.length > 0 && (
        <div>
          <LinkButton onClick={onReset}>Reset search interpretation</LinkButton>
        </div>
      )}
    </div>
  );
}
