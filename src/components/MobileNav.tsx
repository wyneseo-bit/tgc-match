"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Library, Heart, Sparkles, User } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  showDot?: boolean;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav({ matchCount = 0 }: { matchCount?: number }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { label: "Discover", href: "/cards", icon: Compass },
    { label: "Collection", href: "/collection", icon: Library },
    { label: "Wants", href: "/wants", icon: Heart },
    { label: "Matches", href: "/matches", icon: Sparkles, showDot: matchCount > 0 },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 items-center border-t border-border px-3 pb-5 md:hidden"
      style={{ height: 88, background: "rgba(17,20,28,0.85)", backdropFilter: "blur(16px)" }}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-11 flex-col items-center justify-center gap-1"
          >
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: active ? 52 : 28,
                height: active ? 52 : 28,
                marginTop: active ? -22 : 0,
                background: active ? "linear-gradient(135deg,#6C63FF,#A66CFF)" : "transparent",
                boxShadow: active ? "0 8px 24px rgba(108,99,255,0.45)" : "none",
              }}
            >
              <Icon
                size={active ? 22 : 20}
                strokeWidth={2}
                color={active ? "#fff" : "var(--color-muted)"}
              />
              {item.showDot && !active && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
                  style={{ background: "var(--color-coral)" }}
                />
              )}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? "var(--color-text)" : "var(--color-muted)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
