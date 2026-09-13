import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

/**
 * Фотогалерея «до/після»: пари скан-оригінал + колоризована версія.
 *
 * Джерело — public/photo_catalog.json (його готує окремий пайплайн обробки
 * фото). Записи без пари before/after у галерею не потрапляють: у каталозі
 * є рядки, для яких колоризацію ще не робили.
 *
 * Розміри кожного файлу читаються тут, на етапі збірки, і віддаються в
 * розмітку. Без них рамка слайдера не знає пропорції фото й «стрибала б»
 * після завантаження картинки.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT_DIR = path.join(PUBLIC_DIR, "out");

export type GalleryPhoto = {
  /** Номер у каталозі, «001» — він же ключ для посилання ?photo=1 */
  id: string;
  /** Скан оригіналу (ліва половина слайдера) */
  original: string;
  /** Колоризована версія (права половина слайдера) */
  colorized: string;
  width: number;
  height: number;
  description: string;
  year: string;
};

type CatalogEntry = {
  description?: string;
  year?: string;
  theme?: string;
  note?: string;
  colorized?: string;
  before?: string;
  after?: string;
};

type Catalog = {
  files?: Record<string, CatalogEntry>;
};

/**
 * Ширина/висота AVIF з коробки `ispe` (ISO BMFF).
 *
 * Повноцінний парсер контейнера тут зайвий: шукаємо сигнатуру `ispe` й
 * читаємо два 32-бітні числа за нею. У файлі може бути кілька таких коробок
 * (альфа-канал, прев'ю), тому беремо найбільшу — це завжди основне зображення.
 */
function readAvifSize(buffer: Buffer) {
  let best: { width: number; height: number } | null = null;

  for (let i = 0; i + 16 <= buffer.length; i += 1) {
    if (
      buffer[i] === 0x69 && // i
      buffer[i + 1] === 0x73 && // s
      buffer[i + 2] === 0x70 && // p
      buffer[i + 3] === 0x65 // e
    ) {
      // + 4 байти версії/прапорців, далі width і height
      const width = buffer.readUInt32BE(i + 8);
      const height = buffer.readUInt32BE(i + 12);
      const sane = width > 0 && height > 0 && width < 20000 && height < 20000;
      if (sane && (!best || width * height > best.width * best.height)) {
        best = { width, height };
      }
    }
  }

  return best;
}

/** Коробка ispe лежить на початку файлу — далі перших 64 КБ читати нема сенсу. */
async function imageSize(fileName: string) {
  const handle = await readFile(path.join(OUT_DIR, fileName));
  return readAvifSize(handle.subarray(0, 65536));
}

/**
 * Кешується на час збірки: сторінка галереї статична, тож каталог читається
 * один раз, а не на кожен запит.
 */
export const getGalleryPhotos = cache(async (): Promise<GalleryPhoto[]> => {
  const raw = await readFile(path.join(PUBLIC_DIR, "photo_catalog.json"), "utf8");
  const catalog = JSON.parse(raw) as Catalog;
  const entries = Object.values(catalog.files ?? {});

  const photos = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.before || !entry.after) return null;

      const size = await imageSize(entry.before);
      if (!size) return null;

      return {
        id: entry.before.split("-")[0],
        original: `/out/${entry.before}`,
        colorized: `/out/${entry.after}`,
        width: size.width,
        height: size.height,
        description: entry.description?.trim() ?? "",
        year: entry.year?.trim() ?? "",
      } satisfies GalleryPhoto;
    }),
  );

  return photos.filter((photo): photo is GalleryPhoto => photo !== null);
});
