import { demo, type DemoCardKey } from "@/lib/demo";
import { Pocket } from "../Pocket";
import { cx } from "../ui";

/**
 * Pocket at the centre of a loose network of cards, looking toward the one
 * glowing node. The metaphor: we're finding people for you.
 */
const NODES: { id: DemoCardKey; x: number; y: number; lit?: boolean }[] = [
  { id: "blastoise", x: 12, y: 22 },
  { id: "pikachu", x: 30, y: 78 },
  { id: "mewEx", x: 8, y: 64 },
  { id: "umbreon", x: 84, y: 30, lit: true },
  { id: "gengar", x: 70, y: 84 },
  { id: "giratina", x: 92, y: 72 },
  { id: "venusaur", x: 58, y: 10 },
];

export function NetworkScene() {
  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-[720px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {NODES.map((n) => (
          <path
            key={n.id}
            d={`M50 55 Q ${(50 + n.x) / 2} ${(55 + n.y) / 2 + (n.y < 50 ? 10 : -10)} ${n.x} ${n.y}`}
            fill="none"
            stroke={n.lit ? "var(--color-pear)" : "rgb(255 255 255 / 0.16)"}
            strokeWidth={n.lit ? 2 : 1}
            strokeDasharray={n.lit ? undefined : "3 5"}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {NODES.slice(0, 5).map((n, i) => (
          <path
            key={`x${i}`}
            d={`M${n.x} ${n.y} L ${NODES[(i + 2) % NODES.length].x} ${NODES[(i + 2) % NODES.length].y}`}
            stroke="rgb(255 255 255 / 0.06)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {NODES.map((n) => {
        const card = demo(n.id);
        return (
          <div
            key={n.id}
            className={cx(
              "absolute w-[9%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[5%/3.5%]",
              n.lit ? "w-[13%] shadow-[0_0_0_2px_var(--color-pear),0_0_40px_rgb(212_242_106/0.35)]" : "opacity-45 grayscale-[60%]",
            )}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <div className="relative aspect-[63/88]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image_url ?? ""} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        );
      })}
      <div className="absolute left-1/2 top-[55%] w-[22%] -translate-x-1/2 -translate-y-1/2">
        <Pocket expression="curious" prop="binder" size={160} className="h-auto w-full" />
      </div>
    </div>
  );
}
