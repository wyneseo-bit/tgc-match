"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Library,
  Heart,
  Sparkles,
  ArrowLeftRight,
  MessageCircle,
  User,
  SlidersVertical,
  BadgeCheck,
  Plus,
} from "lucide-react";
import { Mascot, type MascotColor } from "./Mascot";

type NavItem = {
  label: string;
  href: string | null;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  badge?: number;
  badgeMuted?: boolean;
};

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  const content = (
    <div
      className="flex h-10 items-center gap-3 rounded-nav px-3 text-sm font-medium"
      style={{
        background: active ? "var(--color-indigo-tint)" : "transparent",
        color: active
          ? "var(--color-text)"
          : item.href
            ? "var(--color-text-nav)"
            : "var(--color-muted)",
        boxShadow: active ? "inset 0 0 0 1px var(--color-indigo-ring)" : "none",
        opacity: item.href ? 1 : 0.5,
      }}
    >
      <Icon
        size={18}
        strokeWidth={2}
        color={active ? "var(--color-indigo-light)" : "currentColor"}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-[11px] font-semibold"
          style={{
            background: item.badgeMuted ? "var(--color-surface-2)" : "var(--color-indigo)",
            color: item.badgeMuted ? "var(--color-text-2-body)" : "#fff",
          }}
        >
          {item.badge}
        </span>
      ) : null}
    </div>
  );

  if (!item.href) {
    return <div className="cursor-default">{content}</div>;
  }

  return <Link href={item.href}>{content}</Link>;
}

export function Sidebar({
  matchCount = 0,
  displayName,
  verified,
  mascotColor = "indigo",
}: {
  matchCount?: number;
  displayName: string;
  verified: boolean;
  mascotColor?: MascotColor;
}) {
  const pathname = usePathname();

  const primary: NavItem[] = [
    { label: "Discover", href: "/cards", icon: Compass },
    { label: "Collection", href: "/collection", icon: Library },
    { label: "Wants", href: "/wants", icon: Heart },
    { label: "Matches", href: "/matches", icon: Sparkles, badge: matchCount || undefined },
    { label: "Trades", href: null, icon: ArrowLeftRight },
  ];

  const secondary: NavItem[] = [
    { label: "Messages", href: null, icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: null, icon: SlidersVertical },
  ];

  return (
    <div
      className="flex h-full w-[240px] flex-none flex-col gap-6 border-r border-border p-4"
      style={{ background: "var(--color-bg-2)" }}
    >
      <div className="flex items-center gap-2.5 px-2">
        <Mascot mood="curious" size={28} color={mascotColor} />
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-text">
            Trade Matcher
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted">
            for TCG collectors
          </span>
        </div>
      </div>

      <Link
        href="/cards"
        className="gradient-primary flex h-10 items-center justify-center gap-2 rounded-btn text-sm font-medium text-white"
        style={{ boxShadow: "0 6px 20px rgba(108,99,255,0.3)" }}
      >
        <Plus size={16} strokeWidth={2} />
        Add Card
      </Link>

      <div className="flex flex-col gap-0.5">
        {primary.map((item) => (
          <NavRow key={item.label} item={item} active={pathname === item.href} />
        ))}
      </div>

      <div className="mx-2 h-px bg-border" />

      <div className="flex flex-col gap-0.5">
        {secondary.map((item) => (
          <NavRow key={item.label} item={item} active={pathname === item.href} />
        ))}
      </div>

      <div className="flex-1" />

      <Link
        href="/profile"
        className="flex items-center gap-2.5 rounded-btn border border-border p-2.5"
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#FF8A7A,#A66CFF)" }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold text-text">
            {displayName}
          </span>
          {verified && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--color-cyan)" }}>
              <BadgeCheck size={12} strokeWidth={2} />
              Identity Verified
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
