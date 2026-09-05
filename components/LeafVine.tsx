import Image from "next/image";
import { BOOK } from "@/config/book";

/**
 * Барвінок, що вʼється по спіралі вздовж лівого краю.
 *
 * Спіраль збоку — це синусоїда: x = 50 + A·sin(φ), y росте рівномірно.
 * cos(φ) працює як «глибина»: +1 — виток попереду, −1 — позаду.
 * Тому дальні листки менші й блідіші, а стебло на дальніх ділянках
 * малюється тоншим і прозорішим — саме це й читається як спіраль.
 */
const LEAF_COUNT = 32;
const TURNS = 3.5;
const AMPLITUDE = 20; // у відсотках ширини смуги
const STEM_STEPS = 260;

type Leaf = {
  key: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  opacity: number;
  front: boolean;
};

const phaseAt = (t: number) => t * TURNS * Math.PI * 2;

const LEAVES: Leaf[] = Array.from({ length: LEAF_COUNT }, (_, i) => {
  const t = (i + 0.5) / LEAF_COUNT;
  const phase = phaseAt(t);
  const sin = Math.sin(phase);
  const cos = Math.cos(phase);
  const depth = 0.5 + 0.5 * cos; // 1 — попереду, 0 — позаду
  const toRight = sin >= 0;
  return {
    key: i,
    x: 50 + AMPLITUDE * sin,
    y: t * 100,
    angle: toRight ? -28 - 22 * cos : -152 + 22 * cos,
    scale: 0.7 + 0.36 * depth,
    opacity: 0.72 + 0.28 * depth,
    front: cos >= 0,
  };
});

/** Стебло, розбите на ділянки «попереду» / «позаду» витка. */
const STEM_SEGMENTS = (() => {
  const segments: { front: boolean; d: string }[] = [];
  let current: { front: boolean; points: string[] } | null = null;

  for (let i = 0; i < STEM_STEPS; i += 1) {
    const t = i / (STEM_STEPS - 1);
    const phase = phaseAt(t);
    const x = 50 + AMPLITUDE * Math.sin(phase);
    const y = t * 1000;
    const front = Math.cos(phase) >= 0;
    const point = `${x.toFixed(2)} ${y.toFixed(2)}`;

    if (!current || current.front !== front) {
      if (current) {
        // зшиваємо ділянки спільною точкою, щоб не було розривів
        current.points.push(point);
        segments.push({ front: current.front, d: `M${current.points.join(" L")}` });
      }
      current = { front, points: [point] };
    } else {
      current.points.push(point);
    }
  }
  if (current) {
    segments.push({ front: current.front, d: `M${current.points.join(" L")}` });
  }
  return segments;
})();

function LeafImage({ leaf }: { leaf: Leaf }) {
  return (
    <span
      className="absolute block h-0 w-0"
      style={{ top: `${leaf.y}%`, left: `${leaf.x}%` }}
    >
      <Image
        src={BOOK.leafPhotoSrc}
        alt=""
        width={320}
        height={150}
        loading="eager"
        className="h-auto w-[50px] max-w-none 2xl:w-[58px]"
        style={{
          transform: `translateY(-50%) rotate(${leaf.angle}deg) scale(${leaf.scale})`,
          transformOrigin: "0 50%",
          opacity: leaf.opacity,
        }}
      />
    </span>
  );
}

export default function LeafVine() {
  return (
    <div aria-hidden="true" className="relative h-full w-full">
      {/* спершу те, що за витком */}
      {LEAVES.filter((leaf) => !leaf.front).map((leaf) => (
        <LeafImage key={leaf.key} leaf={leaf} />
      ))}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
        role="presentation"
      >
        {STEM_SEGMENTS.map((segment, i) => (
          <path
            key={i}
            d={segment.d}
            fill="none"
            stroke="var(--accent-deep)"
            strokeWidth={segment.front ? 1.7 : 1.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={segment.front ? 0.8 : 0.28}
          />
        ))}
      </svg>

      {/* потім те, що перед ним — перекриває стебло */}
      {LEAVES.filter((leaf) => leaf.front).map((leaf) => (
        <LeafImage key={leaf.key} leaf={leaf} />
      ))}
    </div>
  );
}
