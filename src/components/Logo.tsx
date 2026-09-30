import Link from "next/link";
import { Pocket } from "./Pocket";

export function Logo({ compact, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="TCG Trade Matcher home">
      <Pocket crop="face" size={compact ? 30 : 34} animate={false} />
      <span className="leading-none">
        <span className="block font-mono text-[10px] font-medium tracking-[0.2em] text-muted">TCG</span>
        <span className="block font-display text-[17px] font-bold tracking-tight text-fg">Trade Matcher</span>
      </span>
    </Link>
  );
}
