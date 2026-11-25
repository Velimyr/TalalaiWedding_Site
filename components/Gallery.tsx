"use client";

/* eslint-disable @next/next/no-img-element -- Фото вже підготовлені
   пайплайном: AVIF потрібного розміру. Проганяти їх ще раз через next/image
   означає платити за оптимізацію вже оптимізованого і втратити точний збіг
   двох шарів слайдера, який тримається на тому, що обидві картинки —
   однакові за розміром елементи в одній рамці. */

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/gallery";

/** Скільки сусідніх фото підвантажити наперед, щоб гортання було без пауз. */
const PRELOAD_RADIUS = 1;

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState(0);
  /** Позиція шторки у відсотках ширини фото: 0 — весь оригінал, 100 — вся колоризація. */
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  /** Різниця між шторкою і курсором у момент захвату — щоб ручка не стрибала. */
  const dragOffset = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  /**
   * Розгорнутий режим. Нативний повний екран прибирає ще й хром браузера,
   * але Element.requestFullscreen є не всюди (насамперед його немає на iOS),
   * тож стан тримаємо свій: якщо API не спрацював, лишається розкладка на
   * весь в'юпорт, і кнопка поводиться однаково в обох випадках.
   */
  const [expanded, setExpanded] = useState(false);
  const originalBadgeRef = useRef<HTMLSpanElement>(null);
  const colorizedBadgeRef = useRef<HTMLSpanElement>(null);
  /**
   * Краї підписів у відсотках ширини кадру. Підпис ховається, щойно шторка
   * заходить на нього: інакше на 100% оригіналу над фото так і висить
   * «Колоризовано», хоча колоризованого вже не видно.
   *
   * Значення за замовчуванням показують обидва підписи, поки не заміряли.
   */
  const [badgeEdges, setBadgeEdges] = useState({
    originalEnd: 0,
    colorizedStart: 100,
  });

  const frameRef = useRef<HTMLDivElement>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Поки не прочитали ?photo з адреси, назад у неї нічого не пишемо. */
  const restored = useRef(false);

  const photo = photos[index];
  const total = photos.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => (current + delta + total) % total);
      setSplit(50);
    },
    [total],
  );

  const jumpTo = useCallback((next: number) => {
    setIndex(next);
    setSplit(50);
  }, []);

  // Глибоке посилання: ?photo=12. Читаємо один раз після монтування —
  // на сервері адреси немає, інакше була б розбіжність гідратації.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("photo");
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= total) {
      // Адреса — зовнішнє джерело, якого немає на сервері: сторінка статична,
      // тож ?photo можна прочитати тільки тут, уже після гідратації.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(parsed - 1);
    }
    restored.current = true;
  }, [total]);

  useEffect(() => {
    if (!restored.current) return;
    const url = new URL(window.location.href);
    url.searchParams.set("photo", String(index + 1));
    window.history.replaceState(null, "", url);
  }, [index]);

  // Стрілки клавіатури гортають фото. Коли фокус на самій шторці, стрілки
  // рухають її — тому там подія зупиняється, не доходячи сюди.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        jumpTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        jumpTo(total - 1);
      } else if (event.key === "Escape" && !document.fullscreenElement) {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, jumpTo, total]);

  useEffect(() => {
    for (let offset = 1; offset <= PRELOAD_RADIUS; offset += 1) {
      for (const neighbour of [index - offset, index + offset]) {
        const target = photos[(neighbour + total) % total];
        if (!target) continue;
        for (const src of [target.original, target.colorized]) {
          const image = new window.Image();
          image.src = src;
        }
      }
    }
  }, [index, photos, total]);

  // Активна мініатюра завжди має бути видима — інакше на 106 фото стрічка
  // швидко «відстає» від того, що показано в центрі.
  //
  // Скрол саме миттєвий: плавний тут зривається (перевірено — анімація до
  // потрібної позиції обривається на перших пікселях), і при заході за
  // посиланням ?photo=49 стрічка лишалася на початку.
  useEffect(() => {
    const strip = thumbStripRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: "auto",
    });
  }, [index]);

  /** Позиція курсора у відсотках ширини кадру, або null, якщо кадру ще немає. */
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleExpanded = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }

    // Згортання запасного режиму: повний екран тут просити не можна, інакше
    // кнопка «згорнути» відкривала б його замість того, щоб закрити.
    if (expanded) {
      setExpanded(false);
      return;
    }

    setExpanded(true);

    const root = rootRef.current;
    if (root && typeof root.requestFullscreen === "function") {
      // Провал не страшний — розкладка на весь в'юпорт уже ввімкнена вище.
      void root.requestFullscreen().catch(() => {});
    }
  }, [expanded]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(() => {
      const width = frame.clientWidth;
      const original = originalBadgeRef.current;
      const colorized = colorizedBadgeRef.current;
      if (!width || !original || !colorized) return;
      setBadgeEdges({
        originalEnd: ((original.offsetLeft + original.offsetWidth) / width) * 100,
        colorizedStart: (colorized.offsetLeft / width) * 100,
      });
    });

    observer.observe(frame);
    // Самі підписи теж під наглядом: їхня ширина змінюється не лише разом із
    // кадром, а й коли доїжджає веб-шрифт — інакше пороги лишилися б
    // порахованими за запасним шрифтом.
    if (originalBadgeRef.current) observer.observe(originalBadgeRef.current);
    if (colorizedBadgeRef.current) observer.observe(colorizedBadgeRef.current);

    return () => observer.disconnect();
  }, []);

  const splitAtClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return null;
    return ((clientX - rect.left) / rect.width) * 100;
  }, []);

  const applySplit = useCallback((value: number) => {
    setSplit(Math.min(100, Math.max(0, value)));
  }, []);

  if (!photo) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-muted">
        Фотографії ще не додані.
      </div>
    );
  }

  const aspect = photo.width / photo.height;
  // Підпис лишається, лише поки він цілком у своїй половині кадру.
  const showOriginalBadge = split >= badgeEdges.originalEnd;
  const showColorizedBadge = split <= badgeEdges.colorizedStart;

  return (
    <div
      ref={rootRef}
      className={`flex min-h-0 flex-1 flex-col bg-background ${
        expanded ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Сцена: фото вписується в доступний прямокутник без обрізання.
          Ширину рахує сам CSS — звідси container-type на контейнері. */}
      <div
        className="relative min-h-0 flex-1 px-4 py-2 sm:px-16"
        style={{ containerType: "size" }}
      >
        <div
          ref={frameRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 touch-none overflow-hidden rounded-lg bg-surface shadow-[0_24px_60px_-30px_rgba(14,74,46,0.75)] select-none"
          style={{
            aspectRatio: `${photo.width} / ${photo.height}`,
            width: `min(100cqw, 100cqh * ${aspect.toFixed(6)})`,
            cursor: dragging ? "grabbing" : "ew-resize",
          }}
          onPointerDown={(event) => {
            const pointerSplit = splitAtClientX(event.clientX);
            if (pointerSplit === null) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);

            // Натиск по фото переносить шторку під курсор. Але якщо вхопили
            // саме ручку, шторка має лишитися там, де її взяли, — інакше вона
            // смикається на пів ручки вбік ще до першого руху.
            const onHandle =
              event.target instanceof Element &&
              event.target.closest("[data-split-handle]") !== null;

            if (onHandle) {
              dragOffset.current = split - pointerSplit;
            } else {
              dragOffset.current = 0;
              applySplit(pointerSplit);
            }
          }}
          onPointerMove={(event) => {
            if (!dragging) return;
            const pointerSplit = splitAtClientX(event.clientX);
            if (pointerSplit === null) return;
            applySplit(pointerSplit + dragOffset.current);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <img
            src={photo.original}
            alt={photo.description || `Оригінал фотографії ${photo.id}`}
            width={photo.width}
            height={photo.height}
            className="block h-full w-full object-contain"
            draggable={false}
          />
          {/* Колоризований шар лежить поверх оригіналу і відкритий праворуч
              від шторки: ліворуч лишається оригінал. */}
          <img
            src={photo.colorized}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ clipPath: `inset(0 0 0 ${split}%)` }}
            draggable={false}
          />

          {/* На відміну від ручки шторки, цю кнопку подія далі не пускає:
              натиск по ній має відкривати повний екран, а не тягнути шторку. */}
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={toggleExpanded}
            aria-pressed={expanded}
            aria-label={
              expanded ? "Згорнути фото" : "Показати фото на весь екран"
            }
            className="absolute top-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white/80 text-muted shadow-sm transition hover:bg-white hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d={
                  expanded
                    ? "M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3"
                    : "M9 4H6a2 2 0 0 0-2 2v3M15 4h3a2 2 0 0 1 2 2v3M9 20H6a2 2 0 0 1-2-2v-3M15 20h3a2 2 0 0 0 2-2v-3"
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Лічильник поверх фото, а не окремим рядком під ним: знизу він
              з'їдав висоту, якої бракує самому фото. */}
          <span
            className="pointer-events-none absolute top-2 left-2 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-muted tabular-nums"
            aria-live="polite"
          >
            {index + 1} / {total}
          </span>

          <span
            ref={originalBadgeRef}
            aria-hidden={!showOriginalBadge}
            className={`pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-muted uppercase transition-opacity duration-150 ${
              showOriginalBadge ? "opacity-100" : "opacity-0"
            }`}
          >
            Оригінал
          </span>
          <span
            ref={colorizedBadgeRef}
            aria-hidden={!showColorizedBadge}
            className={`pointer-events-none absolute right-2 bottom-2 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-accent uppercase transition-opacity duration-150 ${
              showColorizedBadge ? "opacity-100" : "opacity-0"
            }`}
          >
            Покращено
          </span>

          {/* Сама шторка. Фокусується окремо: коли на ній фокус, стрілки
              рухають її, а не гортають галерею. */}
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(14,74,46,0.35)]"
            style={{ left: `${split}%` }}
          >
            <button
              type="button"
              role="slider"
              aria-label="Межа між оригіналом і покращеним фото"
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split)}
              aria-valuetext={`Показано ${Math.round(split)}% оригіналу`}
              data-split-handle=""
              className="pointer-events-auto absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-line bg-white text-accent shadow-lg"
              // Подія мусить дійти до кадру — саме він веде перетягування.
              // preventDefault лише не дає ручці забрати фокус мишею: інакше
              // після тягання стрілки рухали б шторку, а не гортали галерею.
              // Tab-ом ручка фокусується як і раніше.
              onPointerDown={(event) => event.preventDefault()}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                event.stopPropagation();
                const step = event.shiftKey ? 10 : 2;
                setSplit((current) =>
                  Math.min(
                    100,
                    Math.max(0, current + (event.key === "ArrowLeft" ? -step : step)),
                  ),
                );
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M10 8l-4 4 4 4M14 8l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Попереднє фото"
          className="absolute top-1/2 left-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-accent-deep shadow-md transition hover:bg-white sm:left-3"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Наступне фото"
          className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/90 text-accent-deep shadow-md transition hover:bg-white sm:right-3"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Підпис займає рівно стільки, скільки в ньому тексту: висоту тут
          більше не резервуємо, а на кадрах без опису блока немає взагалі —
          усе вивільнене місце дістається фото. */}
      {photo.description || photo.year ? (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-6 py-2 text-center">
          {photo.description ? (
            <p className="text-sm leading-snug text-foreground sm:text-base">
              {photo.description}
            </p>
          ) : null}
          {photo.year ? (
            <p className="font-display text-lg leading-snug text-accent-deep">
              {photo.year}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        ref={thumbStripRef}
        className="shrink-0 overflow-x-auto border-t border-line bg-surface px-4 py-2"
      >
        <div className="mx-auto flex w-max gap-2">
          {photos.map((item, itemIndex) => {
            const isActive = itemIndex === index;
            return (
              <button
                key={item.id}
                type="button"
                ref={(node) => {
                  thumbRefs.current[itemIndex] = node;
                }}
                onClick={() => jumpTo(itemIndex)}
                aria-label={`Фото ${itemIndex + 1}${item.year ? `, ${item.year}` : ""}`}
                aria-current={isActive ? "true" : undefined}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                  isActive
                    ? "border-accent opacity-100"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* Тут, на відміну від великого кадру, next/image доречний:
                    інакше кожна мініатюра декодувала б повний файл (~1200 px)
                    заради квадрата 64 px. */}
                <Image
                  src={item.colorized}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
