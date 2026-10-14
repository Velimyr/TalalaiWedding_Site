/**
 * Вишиті орнаменти для карток відгуків — мотиви з обкладинки:
 * квітка на стеблі, гілочка барвінку і ромбова смуга, як на рукавах.
 *
 * Кожен вид «прив'язаний» до свого краю картки так, щоб не лізти під текст:
 * гілки стеляться вздовж нижнього краю праворуч (там лише коротке імʼя
 * ліворуч), смуги — у полях картки. Картка мусить мати `relative overflow-hidden`: тоді заокруглений
 * кут акуратно обрізає орнамент.
 */

export const ORNAMENT_KINDS = [
  "flower",
  "periwinkle",
  "bandTop",
  "bandBottom",
  "bandLeft",
] as const;

export type OrnamentKind = (typeof ORNAMENT_KINDS)[number];

/** Кольори вишивки — ті самі, що в палітрі сайту, плюс жовтий з обкладинки. */
const RED = "#c1121f";
const GREEN = "#146c43";
const GREEN_LIGHT = "#2f8f5b";
const GREEN_DEEP = "#0e4a2e";
const GREEN_PALE = "#9fd3b2";
const BLUE = "#1d4ed8";
const YELLOW = "#f2b705";
const PERIWINKLE = "#6a7bd8";

/** Скільки карток у ряду на широкому екрані — від цього рахуємо «1–2 в ряду». */
const ROW_SIZE = 3;

/**
 * Для кожної трійки карток прикрашає одну або дві випадкові, решта — без
 * орнаменту. Сусідні орнаменти не повторюються.
 */
export function pickOrnaments(count: number, random: () => number = Math.random) {
  const result: (OrnamentKind | null)[] = Array.from({ length: count }, () => null);
  let previous: OrnamentKind | null = null;

  for (let start = 0; start < count; start += ROW_SIZE) {
    const size = Math.min(ROW_SIZE, count - start);
    const decorated = Math.min(size, 1 + Math.floor(random() * 2));

    const slots = Array.from({ length: size }, (_, index) => index);
    for (let i = slots.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    for (const slot of slots.slice(0, decorated).sort((a, b) => a - b)) {
      const choices = ORNAMENT_KINDS.filter((kind) => kind !== previous);
      const kind = choices[Math.floor(random() * choices.length)];
      result[start + slot] = kind;
      previous = kind;
    }
  }

  return result;
}

const svgUrl = (svg: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Ромб із серединкою, між ромбами — зелені півромби: на стику вони стуляються. */
const BAND_TILE_H = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">` +
    `<path d="M10 0l5 5-5 5-5-5z" fill="${RED}"/>` +
    `<path d="M10 3l2 2-2 2-2-2z" fill="${YELLOW}"/>` +
    `<path d="M0 2l3 3-3 3zM20 2l-3 3 3 3z" fill="${GREEN}"/>` +
    `</svg>`,
);

const BAND_TILE_V = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20">` +
    `<path d="M0 10l5-5 5 5-5 5z" fill="${RED}"/>` +
    `<path d="M3 10l2-2 2 2-2 2z" fill="${YELLOW}"/>` +
    `<path d="M2 0l3 3 3-3zM2 20l3-3 3 3z" fill="${GREEN}"/>` +
    `</svg>`,
);

/** Листок: вузький човник уздовж осі X, від (0,0) до (len,0). */
const leafPath = (len: number, width: number) =>
  `M0 0C${len * 0.3} ${-width} ${len * 0.75} ${-width} ${len} 0C${len * 0.75} ${width} ${len * 0.3} ${width} 0 0Z`;

/** Вишитий листок: гладь + світліша прожилка посередині. */
function Leaf({
  x,
  y,
  angle,
  len,
  width,
  fill,
  vein,
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  width: number;
  fill: string;
  vein: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={leafPath(len, width)} fill={fill} />
      <path
        d={`M${len * 0.12} 0L${len * 0.82} 0`}
        stroke={vein}
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Вишита «рожа»: два кола пелюсток і серединка. */
function Rose({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={`outer-${i}`}
          d="M0 0C-5 -5 -5 -12 0 -15C5 -12 5 -5 0 0Z"
          transform={`rotate(${i * 45})`}
          fill={RED}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={`inner-${i}`}
          d="M0 0C-2.5 -3 -2.5 -6.5 0 -8C2.5 -6.5 2.5 -3 0 0Z"
          transform={`rotate(${i * 45 + 22.5})`}
          fill={YELLOW}
        />
      ))}
      <circle r="3.4" fill={RED} />
      <circle r="1.4" fill={YELLOW} />
    </g>
  );
}

/** Маленька квітка з круглих пелюсток — синя або жовта. */
function Blossom({
  x,
  y,
  r,
  petal,
  center,
}: {
  x: number;
  y: number;
  r: number;
  petal: string;
  center: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i * 72 * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={(Math.sin(angle) * r).toFixed(2)}
            cy={(-Math.cos(angle) * r).toFixed(2)}
            r={r * 0.62}
            fill={petal}
          />
        );
      })}
      <circle r={r * 0.5} fill={center} />
    </g>
  );
}

/**
 * Гілка з вишитою рожею вздовж нижнього краю картки.
 * Рамка 160×80, кут картки — праворуч унизу (160, 80).
 */
function FlowerSpray() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full">
      <g fill="none" stroke={GREEN} strokeLinecap="round" strokeWidth="1.8">
        <path d="M164 82C142 74 114 71 88 73C68 75 54 71 42 63" />
        <path d="M152 79C148 66 144 56 137 46" />
        <path d="M104 72C100 64 94 59 86 56" />
        <path d="M70 73C70 66 72 61 76 56" />
      </g>
      <Leaf x={146} y={64} angle={-150} len={18} width={5} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={148} y={66} angle={-40} len={14} width={4.5} fill={GREEN_LIGHT} vein={GREEN_PALE} />
      <Leaf x={124} y={72} angle={-145} len={17} width={4.5} fill={GREEN_LIGHT} vein={GREEN_PALE} />
      <Leaf x={112} y={72} angle={-30} len={13} width={4} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={88} y={73} angle={-160} len={15} width={4} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={58} y={70} angle={-115} len={13} width={4} fill={GREEN_LIGHT} vein={GREEN_PALE} />

      <Rose x={136} y={42} scale={1.05} />
      <Blossom x={40} y={61} r={4.6} petal={BLUE} center={YELLOW} />
      <Blossom x={77} y={53} r={3.4} petal={YELLOW} center={RED} />
      <circle cx="86" cy="55" r="2.6" fill={RED} />
      <circle cx="91" cy="51" r="2.2" fill={RED} />
      <circle cx="84" cy="49" r="2" fill={RED} />
    </svg>
  );
}

/** Квітка барвінку: пʼять скошених пелюсток «вертушкою». */
function PeriwinkleFlower({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={i}
          d="M0 0C1 -4 0 -9 -2 -13C3 -15 8 -12 8 -7C7 -3 3 -1 0 0Z"
          transform={`rotate(${i * 72})`}
          fill={PERIWINKLE}
        />
      ))}
      <circle r="2.8" fill="#ffffff" />
      <circle r="1.1" fill={GREEN_DEEP} />
    </g>
  );
}

/**
 * Пагін барвінку, що стелиться вздовж нижнього краю: пари глянцевих
 * листків, дві квітки й закритий пуп'янок. Рамка 160×80.
 */
function PeriwinkleVine() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full">
      <g fill="none" stroke={GREEN_DEEP} strokeLinecap="round" strokeWidth="1.8">
        <path d="M164 80C144 70 124 77 102 71C82 65 68 73 46 67" />
        <path d="M128 73C129 64 130 56 131 48" />
        <path d="M66 70C66 64 65 59 63 54" />
        <path d="M96 70C95 64 93 60 90 56" />
      </g>
      <Leaf x={146} y={73} angle={-160} len={20} width={5} fill={GREEN_DEEP} vein={GREEN_LIGHT} />
      <Leaf x={146} y={73} angle={-60} len={17} width={4.5} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={114} y={74} angle={-155} len={19} width={5} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={114} y={74} angle={-35} len={16} width={4.5} fill={GREEN_DEEP} vein={GREEN_LIGHT} />
      <Leaf x={80} y={68} angle={-150} len={17} width={4.5} fill={GREEN_DEEP} vein={GREEN_LIGHT} />
      <Leaf x={80} y={68} angle={-40} len={14} width={4} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={52} y={68} angle={-165} len={13} width={4} fill={GREEN} vein={GREEN_PALE} />

      <PeriwinkleFlower x={131} y={44} scale={1.2} />
      <PeriwinkleFlower x={62} y={50} scale={0.85} />
      {/* Закритий пуп'янок — скручене веретено. */}
      <path
        d="M90 56C86 52 86 46 89 41C93 45 94 51 90 56Z"
        fill={PERIWINKLE}
        transform="rotate(-12 90 56)"
      />
    </svg>
  );
}

export default function ReviewOrnament({ kind }: { kind: OrnamentKind }) {
  // З'являється плавно: на сторінці орнаменти розставляються вже в браузері.
  const base = "pointer-events-none absolute animate-[ornament-in_700ms_ease-out]";

  switch (kind) {
    case "flower":
      return (
        <div aria-hidden="true" className={`${base} right-0 bottom-0 h-20 w-40`}>
          <FlowerSpray />
        </div>
      );
    case "periwinkle":
      return (
        <div aria-hidden="true" className={`${base} right-0 bottom-0 h-20 w-40`}>
          <PeriwinkleVine />
        </div>
      );
    // Смуги не доходять до кутів: заокруглення обрізало б їх навскіс.
    case "bandTop":
    case "bandBottom":
      return (
        <div
          aria-hidden="true"
          className={`${base} inset-x-5 h-2.5 ${kind === "bandTop" ? "top-2" : "bottom-2"}`}
          style={{ backgroundImage: BAND_TILE_H, backgroundRepeat: "repeat-x" }}
        />
      );
    case "bandLeft":
      return (
        <div
          aria-hidden="true"
          className={`${base} inset-y-5 left-2 w-2.5`}
          style={{ backgroundImage: BAND_TILE_V, backgroundRepeat: "repeat-y" }}
        />
      );
  }
}
