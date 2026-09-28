"use client";

import { X } from "lucide-react";
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
    <span
      className="flex items-center gap-1.5 rounded-pill py-1 pl-3 pr-2 text-xs"
      style={{
        background: "var(--color-indigo-tint)",
        border: "1px solid var(--color-indigo-ring)",
        color: "var(--color-indigo-light)",
      }}
    >
      <span style={{ color: "var(--color-muted)" }}>{label}</span>
      {value}
      <button type="button" aria-label={removeLabel} onClick={onRemove}>
        <X size={13} strokeWidth={2} />
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
      className="text-xs font-medium underline"
      style={{ color: "var(--color-indigo-light)" }}
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
        <p className="text-sm" style={{ color: "var(--color-text-2-body)" }}>
          Showing results for{" "}
          <span className="font-semibold" style={{ color: "var(--color-text)" }}>
            {searchedName}
          </span>
          . <LinkButton onClick={() => onToggle("typo")}>Search instead for &quot;{query.trim()}&quot;</LinkButton>
        </p>
      )}
      {spellingOff && (
        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
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
              <span
                className="rounded-pill px-3 py-1 text-xs"
                style={{
                  background: "var(--color-indigo-tint)",
                  border: "1px solid var(--color-indigo-ring)",
                  color: "var(--color-indigo-light)",
                }}
              >
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
