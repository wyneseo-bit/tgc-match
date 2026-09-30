import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { Pocket, type Sleeve } from "./Pocket";
import { cx } from "./ui";

const SLEEVES: Sleeve[] = ["pear", "seal", "blush", "paper"];

/** A stable sleeve colour per collector, so the same person always looks the same. */
export function sleeveFor(seed: string): Sleeve {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return SLEEVES[Math.abs(h) % SLEEVES.length];
}

/** Every collector gets a Pocket in their own sleeve colour instead of a generic avatar. */
export function Avatar({
  seed,
  verified,
  size = 44,
  className,
}: {
  /** Usually the user id. */
  seed: string;
  verified?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[30%] bg-page-2 ring-1 ring-inset ring-line-2",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Pocket crop="face" sleeve={sleeveFor(seed)} size={Math.round(size * 0.92)} animate={false} />
      {verified && (
        <span className="absolute -bottom-px -right-px grid place-items-center rounded-full bg-night p-px">
          <SealCheck size={Math.max(12, size * 0.3)} weight="fill" className="text-seal" aria-label="Identity verified" />
        </span>
      )}
    </span>
  );
}
