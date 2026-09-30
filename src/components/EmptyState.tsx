import { Pocket, type Expression, type Prop } from "./Pocket";
import { ButtonLink } from "./ui";

/**
 * Empty states are where Pocket does the most work: character first,
 * one sentence of explanation, one clear way forward.
 */
export function EmptyState({
  expression,
  prop = "none",
  title,
  body,
  actions,
}: {
  expression: Expression;
  prop?: Prop;
  title: string;
  body: string;
  actions: { href: string; label: string; variant: "primary" | "secondary" }[];
}) {
  return (
    <div className="relative mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center md:py-24">
      <div className="relative">
        <div className="absolute inset-x-[-30%] bottom-2 h-10 rounded-[50%] bg-pear/10 blur-2xl" aria-hidden />
        <Pocket expression={expression} prop={prop} size={150} className="relative" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-[46ch] text-muted">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {actions.map((a) => (
          <ButtonLink key={a.label} href={a.href} variant={a.variant}>
            {a.label}
          </ButtonLink>
        ))}
      </div>
    </div>
  );
}
