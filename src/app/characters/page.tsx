import { Pocket, type Expression, type Prop } from "@/components/Pocket";

export const metadata = { title: "Meet Pocket" };

const SHEET: { expression: Expression; prop: Prop; use: string }[] = [
  { expression: "curious", prop: "binder", use: "Discovery" },
  { expression: "excited", prop: "card", use: "New matches" },
  { expression: "thinking", prop: "none", use: "Finding matches" },
  { expression: "celebrating", prop: "two-cards", use: "Completed trades" },
  { expression: "concerned", prop: "none", use: "Warnings and disputes" },
  { expression: "sleeping", prop: "none", use: "Pending and waiting" },
  { expression: "searching", prop: "none", use: "Matching and loading" },
];

export default function CharactersPage() {
  return (
    <main className="room min-h-dvh px-4 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-4xl font-bold tracking-tight">Meet Pocket.</h1>
        <p className="mt-2 max-w-[56ch] text-muted">
          A trading card that wears its sleeve like a cap. The thumb-notch keeps it recognisable at any size.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SHEET.map((s) => (
            <figure key={s.expression} className="flex flex-col items-center rounded-lg bg-cover px-4 pb-5 pt-8 ring-1 ring-inset ring-line">
              <Pocket expression={s.expression} prop={s.prop} size={120} />
              <figcaption className="mt-4 text-center">
                <div className="font-medium capitalize text-fg">{s.expression}</div>
                <div className="text-sm text-muted">{s.use}</div>
              </figcaption>
            </figure>
          ))}
          <figure className="flex flex-col items-center justify-center gap-4 rounded-lg bg-cover px-4 py-6 ring-1 ring-inset ring-line">
            <div className="flex items-end gap-3">
              {(["pear", "seal", "blush", "paper"] as const).map((s) => (
                <Pocket key={s} sleeve={s} crop="face" size={44} />
              ))}
            </div>
            <div className="flex items-end gap-3">
              <Pocket crop="face" size={32} />
              <Pocket crop="face" size={20} />
            </div>
            <figcaption className="text-center text-sm text-muted">Avatars and icon sizes</figcaption>
          </figure>
        </div>
      </div>
    </main>
  );
}
