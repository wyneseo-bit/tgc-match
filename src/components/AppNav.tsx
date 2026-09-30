"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowsLeftRight,
  Books,
  ChatCircle,
  Compass,
  Gear,
  Heart,
  Plus,
  SealCheck,
  SignOut,
  Sparkle,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import { signOut } from "@/app/login/actions";
import { Avatar } from "./Collector";
import { Logo } from "./Logo";
import { buttonClass, cx } from "./ui";

/** `href: null` marks a section that isn't built yet: shown, but not a link. */
type Item = { href: string | null; label: string; icon: Icon; badge?: string };

function useActive() {
  const path = usePathname();
  return (href: string | null) => !!href && (path === href || path.startsWith(`${href}/`));
}

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  const body = (
    <>
      <Icon
        size={20}
        weight={active ? "fill" : "regular"}
        className={active ? "text-pear" : "text-muted group-hover:text-fg-2"}
        aria-hidden
      />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-pear px-2 py-0.5 text-[11px] font-semibold text-pear-ink">{item.badge}</span>
      )}
      {!item.href && <span className="text-[11px] text-muted">Soon</span>}
    </>
  );
  const cls = "group flex h-11 items-center gap-3 rounded-md px-3 text-[15px] transition-colors duration-150";

  if (!item.href) {
    return (
      <div className={cx(cls, "cursor-default text-muted opacity-60")} aria-disabled>
        {body}
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cx(cls, active ? "bg-page-2 text-fg" : "text-fg-2 hover:bg-white/[0.04] hover:text-fg")}
    >
      {body}
    </Link>
  );
}

export function Sidebar({
  userId,
  displayName,
  verified,
  matchCount,
}: {
  userId: string;
  displayName: string;
  verified: boolean;
  matchCount: number;
}) {
  const isActive = useActive();

  const primary: Item[] = [
    { href: "/cards", label: "Discover", icon: Compass },
    { href: "/collection", label: "Collection", icon: Books },
    { href: "/wants", label: "Wants", icon: Heart },
    { href: "/matches", label: "Matches", icon: Sparkle, badge: matchCount ? String(matchCount) : undefined },
    { href: null, label: "Trades", icon: ArrowsLeftRight },
  ];
  const secondary: Item[] = [
    { href: null, label: "Messages", icon: ChatCircle },
    { href: "/profile", label: "Profile", icon: UserCircle },
    { href: null, label: "Settings", icon: Gear },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col bg-cover lg:flex">
      {/* Binder spine: the sidebar is the cover, pages open to the right. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-line-2" />
      <div className="pointer-events-none absolute right-[-5px] top-0 flex h-full flex-col justify-around py-24">
        <span className="ring-hole" />
        <span className="ring-hole" />
        <span className="ring-hole" />
      </div>

      <div className="px-5 pb-4 pt-6">
        <Logo href="/matches" />
      </div>
      <div className="px-4">
        <Link href="/cards" className={buttonClass("primary", "md", "w-full")}>
          <Plus size={18} weight="bold" aria-hidden /> Add card
        </Link>
      </div>

      <nav aria-label="Main" className="mt-6 flex flex-1 flex-col px-3">
        <div className="space-y-0.5">
          {primary.map((i) => (
            <NavLink key={i.label} item={i} active={isActive(i.href)} />
          ))}
        </div>
        <div className="mx-3 my-4 h-px bg-line" />
        <div className="space-y-0.5">
          {secondary.map((i) => (
            <NavLink key={i.label} item={i} active={isActive(i.href)} />
          ))}
        </div>
      </nav>

      <div className="m-3 flex items-center gap-2 rounded-lg bg-page p-2.5 ring-1 ring-inset ring-line">
        <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar seed={userId} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-fg">{displayName}</span>
            {verified ? (
              <span className="flex items-center gap-1 text-xs text-seal">
                <SealCheck size={12} weight="fill" aria-hidden /> Identity Verified
              </span>
            ) : (
              <span className="block text-xs text-muted">View profile</span>
            )}
          </span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/5 hover:text-fg"
          >
            <SignOut size={17} aria-hidden />
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <div className="glass sticky top-0 z-30 flex h-14 items-center justify-between rounded-none border-x-0 border-t-0 px-4 lg:hidden">
      <Logo compact href="/matches" />
      <Link href="/cards" aria-label="Add card" className="grid size-11 place-items-center rounded-full bg-pear text-pear-ink">
        <Plus size={20} weight="bold" aria-hidden />
      </Link>
    </div>
  );
}

export function MobileNav({ matchCount }: { matchCount: number }) {
  const isActive = useActive();
  const items: (Item & { href: string })[] = [
    { href: "/cards", label: "Discover", icon: Compass },
    { href: "/collection", label: "Collection", icon: Books },
    { href: "/matches", label: "Matches", icon: Sparkle },
    { href: "/wants", label: "Wants", icon: Heart },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-[22px] px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 lg:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        if (item.href === "/matches") {
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-1">
              <span className="relative -mt-6 grid size-14 place-items-center rounded-full bg-pear text-pear-ink shadow-[0_10px_24px_-8px_rgb(212_242_106/0.6)] ring-4 ring-night">
                <Icon size={24} weight="fill" aria-hidden />
                {matchCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-night text-[10px] font-bold text-pear ring-2 ring-pear">
                    {matchCount > 9 ? "9+" : matchCount}
                  </span>
                )}
              </span>
              <span className={cx("text-[11px] font-semibold", active ? "text-pear" : "text-fg-2")}>{item.label}</span>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx("flex min-h-12 flex-col items-center justify-center gap-1", active ? "text-fg" : "text-muted")}
          >
            <Icon size={22} weight={active ? "fill" : "regular"} className={active ? "text-pear" : undefined} aria-hidden />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
