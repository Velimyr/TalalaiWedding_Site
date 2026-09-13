import type { Metadata } from "next";
import Gallery from "@/components/Gallery";
import SiteHeader from "@/components/SiteHeader";
import { BOOK } from "@/config/book";
import { getGalleryPhotos } from "@/lib/gallery";

const TITLE = "Фотогалерея";
const DESCRIPTION =
  "Архівні фотографії Талалаївщини: скан оригіналу і колоризована версія в одному кадрі — пересуньте шторку, щоб порівняти.";

export const metadata: Metadata = {
  title: `${TITLE} — ${BOOK.title}`,
  description: DESCRIPTION,
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    type: "website",
    url: `${BOOK.siteUrl}/gallery`,
    siteName: BOOK.title,
    title: `${TITLE} — ${BOOK.title}`,
    description: DESCRIPTION,
  },
};

/**
 * Каталог і розміри фото читаються з диска, тож сторінка має бути
 * статичною: інакше на проді довелося б лізти у public/ під час запиту.
 */
export const dynamic = "force-static";

export default async function GalleryPage() {
  const photos = await getGalleryPhotos();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <SiteHeader variant="page" />
      <main className="flex min-h-0 flex-1 flex-col">
        <h1 className="sr-only">
          {TITLE} — {BOOK.title}
        </h1>
        <Gallery photos={photos} />
      </main>
    </div>
  );
}
