import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { cx } from "./ui";

const RULES = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One symbol", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

export function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-2.5 rounded-md bg-page p-4 ring-1 ring-inset ring-line" aria-label="Password rules">
      {RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.label} className={cx("flex items-center gap-2.5 text-sm", met ? "text-fg" : "text-muted")}>
            <span
              className={cx(
                "grid size-5 shrink-0 place-items-center rounded-full",
                met ? "bg-pear/15 text-pear" : "bg-page-2 text-muted",
              )}
            >
              {met ? <Check size={11} weight="bold" aria-hidden /> : <X size={11} weight="bold" aria-hidden />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function passwordMeetsRules(password: string) {
  return RULES.every((rule) => rule.test(password));
}
