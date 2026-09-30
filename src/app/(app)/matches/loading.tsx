import { Pocket } from "@/components/Pocket";

export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <div className="flex items-end gap-4">
        <Pocket expression="searching" size={76} className="shrink-0" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Finding collectors who match...</h1>
          <p className="mt-2 text-muted">Checking cards, preferences and trust signals.</p>
        </div>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-page p-5 ring-1 ring-inset ring-line">
            <div className="h-7 w-28 animate-pulse rounded-md bg-page-2" />
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="pocket-empty aspect-[63/88]" />
              <div className="size-10 rounded-full bg-page-2" />
              <div className="pocket-empty aspect-[63/88]" />
            </div>
            <div className="mt-5 h-4 w-3/4 animate-pulse rounded bg-page-2" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-page-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
