import { Check, X } from "lucide-react";

const RULES = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One symbol", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function PasswordRules({ password }: { password: string }) {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-btn p-4"
      style={{ background: "var(--color-bg-2)", border: "1px solid var(--color-border)" }}
    >
      {RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <span
            key={rule.label}
            className="flex items-center gap-2.5 text-sm"
            style={{ color: met ? "var(--color-text-2)" : "var(--color-muted)" }}
          >
            <span
              className="flex h-4.5 w-4.5 flex-none items-center justify-center rounded-full"
              style={{ background: met ? "var(--color-cyan-tint)" : "var(--color-surface-2)" }}
            >
              {met ? (
                <Check size={11} strokeWidth={3} color="var(--color-cyan)" />
              ) : (
                <X size={11} strokeWidth={3} color="var(--color-muted)" />
              )}
            </span>
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}

export function passwordMeetsRules(password: string) {
  return RULES.every((rule) => rule.test(password));
}
