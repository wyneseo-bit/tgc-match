import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Pocket, type Expression } from "./Pocket";
import { cx } from "./ui";

/** A little binder page: a few sleeved pockets and a couple left empty on purpose. */
function MiniBinder() {
  const slots = [true, false, true, true, false, true];
  return (
    <div className="grid w-[260px] grid-cols-3 gap-3 rounded-lg bg-page p-4 ring-1 ring-inset ring-line" aria-hidden>
      {slots.map((filled, i) =>
        filled ? (
          <div key={i} className="pocket p-[8%]">
            <div
              className={cx(
                "aspect-[63/88] rounded-[5%/3.5%] ring-1 ring-inset ring-white/10",
                i === 0
                  ? "bg-[linear-gradient(150deg,rgb(212_242_106/0.55),rgb(212_242_106/0.12))]"
                  : "bg-[linear-gradient(150deg,var(--color-page-3),var(--color-page-2))]",
              )}
            />
            <span className="pocket-lip" />
          </div>
        ) : (
          <div key={i} className="pocket-empty aspect-[63/88]" data-lit={i === 4 || undefined} />
        ),
      )}
    </div>
  );
}

/**
 * Two-panel auth layout. The binder cover sits on the left on desktop;
 * on mobile only the form shows, with the logo above it.
 */
export function AuthShell({
  expression = "curious",
  title,
  body,
  topRight,
  children,
}: {
  expression?: Expression;
  title: ReactNode;
  body: ReactNode;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="room grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col overflow-hidden bg-cover p-10 lg:flex">
        {/* Binder spine */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-line-2" />
        <div className="pointer-events-none absolute right-[-5px] top-0 flex h-full flex-col justify-around py-24">
          <span className="ring-hole" />
          <span className="ring-hole" />
          <span className="ring-hole" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_22rem_at_50%_48%,rgb(212_242_106/0.07),transparent_70%)]" />

        <Logo />
        <div className="relative flex flex-1 flex-col items-center justify-center">
          <Pocket expression={expression} size={132} className="relative z-10 -mb-5" />
          <MiniBinder />
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight">{title}</h2>
          <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-fg-2">{body}</p>
        </div>
      </aside>

      <div className="flex flex-col px-4 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <div className="ml-auto text-sm text-muted">{topRight}</div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </main>
  );
}

export function OrDivider({ children = "or" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line-2" />
      {children}
      <span className="h-px flex-1 bg-line-2" />
    </div>
  );
}
