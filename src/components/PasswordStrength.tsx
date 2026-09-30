import { cx } from "./ui";

function scorePassword(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ["Too short", "Weak password", "Fair password", "Good password", "Strong password"];

export function PasswordStrength({ password }: { password: string }) {
  const score = password.length === 0 ? 0 : Math.max(1, scorePassword(password));
  const tone = score <= 1 ? "bg-danger" : score === 2 ? "bg-warn" : "bg-pear";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-4 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cx("h-1 rounded-full transition-colors", i <= score ? tone : "bg-page-2")} />
        ))}
      </div>
      {password.length > 0 && (
        <span className={cx("text-xs", score <= 1 ? "text-danger" : score === 2 ? "text-warn" : "text-pear")} aria-live="polite">
          {LABELS[score]}
        </span>
      )}
    </div>
  );
}
