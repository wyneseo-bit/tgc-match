import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { SealCheck, ShieldCheck, Handshake } from "@phosphor-icons/react/dist/ssr";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition duration-200 ease-soft active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "bg-pear text-pear-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.12),0_10px_24px_-12px_rgb(212_242_106/0.55)] hover:bg-pear-2",
  secondary: "bg-page-2 text-fg ring-1 ring-inset ring-line-2 hover:bg-page-3",
  ghost: "text-fg-2 hover:bg-white/5 hover:text-fg",
  danger: "text-danger ring-1 ring-inset ring-danger/35 hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

/** Text inputs. Pear ring + soft glow on focus, danger ring when invalid. */
export function fieldClass(error?: boolean, className?: string) {
  return cx(
    "h-12 w-full rounded-md bg-page px-4 text-[15px] text-fg ring-1 ring-inset transition placeholder:text-muted focus:bg-page-2 focus:outline-none",
    error
      ? "ring-danger/60 shadow-[0_0_0_4px_rgb(255_114_114/0.08)]"
      : "ring-line-2 focus:shadow-[0_0_0_4px_rgb(212_242_106/0.12)] focus:ring-pear/70",
    className,
  );
}

/** Compact pill-shaped select, used for per-card settings and filters. */
export const selectClass =
  "h-9 rounded-full bg-page-2 px-3 text-sm text-fg ring-1 ring-inset ring-line-2 transition hover:bg-page-3 focus:outline-none focus:ring-pear/70 disabled:opacity-45";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* Trust badges. Restrained: an icon and a word, seal blue only for trust. */

export function IdentityBadge({ verified = true, className }: { verified?: boolean; className?: string }) {
  if (!verified) {
    return (
      <span className={cx("inline-flex items-center gap-1.5 text-sm text-muted", className)}>
        <SealCheck size={16} weight="regular" aria-hidden /> Identity not verified
      </span>
    );
  }
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium text-seal", className)}>
      <SealCheck size={16} weight="fill" aria-hidden /> Identity Verified
    </span>
  );
}

export function TrustChip({ kind }: { kind: "trusted" | "protected" | "verified-trade" }) {
  const map = {
    trusted: { icon: Handshake, label: "Trusted Trader" },
    protected: { icon: ShieldCheck, label: "Trade Protected" },
    "verified-trade": { icon: SealCheck, label: "Verified Trade" },
  } as const;
  const { icon: Icon, label } = map[kind];
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-seal/10 px-2.5 text-xs font-medium text-seal ring-1 ring-inset ring-seal/20">
      <Icon size={14} weight="bold" aria-hidden /> {label}
    </span>
  );
}

export function Score({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  return (
    <span
      className={cx(
        "inline-flex items-baseline gap-1 font-display font-bold tracking-tight text-pear tabular-nums",
        size === "lg" ? "text-5xl" : "text-2xl",
      )}
    >
      {value}%
      <span className={cx("font-sans font-semibold tracking-wide text-pear/80", size === "lg" ? "text-sm" : "text-[11px]")}>
        MATCH
      </span>
    </span>
  );
}

export function PageHeader({
  title,
  lede,
  action,
  mascot,
}: {
  title: string;
  lede?: ReactNode;
  action?: ReactNode;
  mascot?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex items-end gap-4">
        {mascot}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">{title}</h1>
          {lede && <p className="mt-2 max-w-[60ch] text-base text-muted">{lede}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

/** Solid panel. The default container; glass is reserved for floating UI. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-lg bg-page ring-1 ring-inset ring-line", className)} {...props} />;
}

export function Fact({ value, label, tone }: { value: ReactNode; label: string; tone?: "seal" }) {
  return (
    <div>
      <div className={cx("font-display text-2xl font-semibold tracking-tight tabular-nums", tone === "seal" ? "text-seal" : "text-fg")}>
        {value}
      </div>
      <div className="mt-0.5 text-sm text-muted">{label}</div>
    </div>
  );
}
