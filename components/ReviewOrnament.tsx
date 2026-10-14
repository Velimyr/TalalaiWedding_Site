/**
 * Вишиті квіткові орнаменти для карток відгуків — у кольорах обкладинки.
 * Чотири гілки: рожа, барвінок, мак і волошки.
 *
 * Усі стеляться вздовж нижнього краю праворуч: там лише коротке імʼя
 * ліворуч, тож під текст вони не лізуть. Картка мусить мати
 * `relative overflow-hidden`: тоді заокруглений кут акуратно обрізає гілку.
 */

export const ORNAMENT_KINDS = ["rose", "periwinkle", "poppy", "cornflower"] as const;

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
const RED_DARK = "#8f0d17";
const INK = "#1f1a17";
const SAGE = "#5f8f6e";
const BLUE_LIGHT = "#5b84f0";
const BLUE_DEEP = "#1e2f8f";

/** Скільки карток у ряду на широкому екрані — від цього рахуємо сусідство. */
const COLUMNS = 3;

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Картки стоять поруч у сітці: в одному ряду впритул або одна під одною. */
const areNeighbours = (a: number, b: number) => {
  const sameRow = Math.floor(a / COLUMNS) === Math.floor(b / COLUMNS);
  return (sameRow && Math.abs(a - b) === 1) || Math.abs(a - b) === COLUMNS;
};

/**
 * Прикрашає приблизно третину–половину карток (на 6 карток — 2 або 3),
 * і так, щоб орнаменти не збивалися докупи: дві прикрашені картки ніколи
 * не стоять поруч — ні в ряду, ні одна під одною. Види квітів не повторюються.
 */
export function pickOrnaments(count: number, random: () => number = Math.random) {
  const result: (OrnamentKind | null)[] = Array.from({ length: count }, () => null);
  if (count === 0) return result;

  const min = Math.max(1, Math.round(count / 3));
  const max = Math.max(min, Math.floor(count / 2));
  const target = min + Math.floor(random() * (max - min + 1));

  // Жадібно беремо картки у випадковому порядку, пропускаючи сусідів уже
  // обраних. Інколи такий обхід заганяє себе в кут і набирає менше, ніж
  // треба, — тоді пробуємо ще раз і лишаємо найкращу спробу.
  let best: number[] = [];
  for (let attempt = 0; attempt < 20 && best.length < target; attempt += 1) {
    const picked: number[] = [];
    for (const index of shuffled(
      Array.from({ length: count }, (_, i) => i),
      random,
    )) {
      if (picked.length === target) break;
      if (picked.every((other) => !areNeighbours(index, other))) {
        picked.push(index);
      }
    }
    if (picked.length > best.length) best = picked;
  }

  const kinds = shuffled(ORNAMENT_KINDS, random);
  best
    .sort((a, b) => a - b)
    .forEach((index, order) => {
      result[index] = kinds[order % kinds.length];
    });

  return result;
}

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
function RoseSpray() {
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

/** Мак: чотири широкі пелюстки (задні — темніші) і чорна серединка з тичинками. */
function Poppy({ x, y, r }: { x: number; y: number; r: number }) {
  const petal = (angle: number, fill: string) => {
    const rad = (angle * Math.PI) / 180;
    return (
      <circle
        cx={(Math.cos(rad) * r * 0.42).toFixed(2)}
        cy={(Math.sin(rad) * r * 0.42).toFixed(2)}
        r={r * 0.62}
        fill={fill}
      />
    );
  };
  return (
    <g transform={`translate(${x} ${y})`}>
      {petal(-135, RED_DARK)}
      {petal(-45, RED_DARK)}
      {petal(45, RED)}
      {petal(135, RED)}
      {Array.from({ length: 10 }, (_, i) => {
        const rad = ((i * 36) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={(Math.cos(rad) * r * 0.5).toFixed(2)}
            y2={(Math.sin(rad) * r * 0.5).toFixed(2)}
            stroke={INK}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        );
      })}
      <circle r={r * 0.24} fill={INK} />
    </g>
  );
}

/**
 * Гілка маків: велика квітка, менша і похилений пуп'янок
 * на тонких стеблах з сизим листям. Рамка 160×80.
 */
function PoppySpray() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full">
      <g fill="none" stroke={SAGE} strokeLinecap="round" strokeWidth="1.6">
        <path d="M164 82C146 76 120 75 96 75C76 75 60 72 46 66" />
        <path d="M148 78C142 66 136 56 132 44" />
        <path d="M84 75C80 68 76 62 70 56" />
        <path d="M112 75C113 66 112 58 106 51" />
      </g>
      <Leaf x={140} y={76} angle={-160} len={20} width={4} fill={SAGE} vein={GREEN_PALE} />
      <Leaf x={140} y={75} angle={-70} len={15} width={3.5} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={100} y={75} angle={-150} len={17} width={3.5} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={62} y={72} angle={-160} len={15} width={3.5} fill={SAGE} vein={GREEN_PALE} />

      <Poppy x={131} y={38} r={15} />
      <Poppy x={68} y={51} r={10} />
      {/* Похилений пуп'янок. */}
      <ellipse cx="104" cy="54" rx="3.6" ry="5.6" fill={SAGE} transform="rotate(35 104 54)" />
      <path d="M102 51C103 49 105 49 106 51" stroke={RED} strokeWidth="1.4" fill="none" />
    </svg>
  );
}

/** Волошка: віночок зубчастих лієчок навколо темної серединки. */
function Cornflower({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M0 ${-r * 0.3}L${-r * 0.32} ${-r}L${-r * 0.1} ${-r * 0.86}L0 ${-r * 1.02}L${r * 0.1} ${-r * 0.86}L${r * 0.32} ${-r}Z`}
          transform={`rotate(${i * 40})`}
          fill={i % 2 === 0 ? BLUE : BLUE_LIGHT}
        />
      ))}
      <circle r={r * 0.36} fill={BLUE_DEEP} />
      <circle r={r * 0.14} fill={YELLOW} />
    </g>
  );
}

/**
 * Гілка волошок: дві квітки й пуп'янок, вузьке сизе листя,
 * між ними — жовті колоски. Рамка 160×80.
 */
function CornflowerSpray() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full">
      <g fill="none" stroke={SAGE} strokeLinecap="round" strokeWidth="1.6">
        <path d="M164 80C150 74 132 74 112 75C90 76 70 73 50 67" />
        <path d="M146 76C140 64 136 54 134 44" />
        <path d="M96 75C92 68 88 62 82 57" />
        <path d="M120 75C121 68 121 62 119 56" />
        <path d="M66 71C66 65 64 60 60 56" />
      </g>
      <Leaf x={138} y={75} angle={-165} len={22} width={2.8} fill={SAGE} vein={GREEN_PALE} />
      <Leaf x={138} y={75} angle={-75} len={14} width={2.6} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={106} y={75} angle={-160} len={19} width={2.6} fill={GREEN} vein={GREEN_PALE} />
      <Leaf x={74} y={73} angle={-160} len={17} width={2.6} fill={SAGE} vein={GREEN_PALE} />

      <Cornflower x={134} y={40} r={13} />
      <Cornflower x={81} y={54} r={9} />
      {/* Пуп'янок: зелена чашечка з синім кінчиком. */}
      <ellipse cx="119" cy="54" rx="3.4" ry="4.6" fill={GREEN} />
      <path d="M116.4 51.5L119 47.5L121.6 51.5Z" fill={BLUE} />
      {/* Колосок. */}
      <g fill={YELLOW}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx={i % 2 === 0 ? 58.6 : 61.4}
            cy={53 - i * 3.4}
            rx="1.5"
            ry="2.4"
            transform={`rotate(${i % 2 === 0 ? -25 : 25} ${i % 2 === 0 ? 58.6 : 61.4} ${53 - i * 3.4})`}
          />
        ))}
      </g>
    </svg>
  );
}

const SPRAYS: Record<OrnamentKind, () => React.JSX.Element> = {
  rose: RoseSpray,
  periwinkle: PeriwinkleVine,
  poppy: PoppySpray,
  cornflower: CornflowerSpray,
};

export default function ReviewOrnament({ kind }: { kind: OrnamentKind }) {
  const Spray = SPRAYS[kind];
  return (
    // З'являється плавно: на сторінці орнаменти розставляються вже в браузері.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 bottom-0 h-20 w-40 animate-[ornament-in_700ms_ease-out]"
    >
      <Spray />
    </div>
  );
}
