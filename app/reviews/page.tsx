import type { Metadata } from "next";
import ReviewGrid from "@/components/ReviewGrid";
import ReviewModal from "@/components/ReviewModal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { BOOK, REVIEW_FORM, REVIEWS } from "@/config/book";

const TITLE = "Відгуки читачів";
const DESCRIPTION = `Що кажуть читачі про книгу «${BOOK.title}» — усі відгуки в одному місці.`;

export const metadata: Metadata = {
  title: `${TITLE} — ${BOOK.title}`,
  description: DESCRIPTION,
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    type: "website",
    url: `${BOOK.siteUrl}/reviews`,
    siteName: BOOK.title,
    title: `${TITLE} — ${BOOK.title}`,
    description: DESCRIPTION,
  },
};

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader variant="page" current="/reviews" />

      <main className="flex-1">
        <section className="border-b border-line bg-surface">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-6 px-6 py-12">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-accent">
                Відгуки · {REVIEWS.length}
              </p>
              <h1 className="font-display text-4xl text-accent-deep sm:text-5xl">
                {TITLE}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted">
                {REVIEW_FORM.text}
              </p>
            </div>
            <ReviewModal />
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-5xl px-6 py-12">
            {REVIEWS.length > 0 ? (
              <ReviewGrid reviews={REVIEWS} />
            ) : (
              <p className="text-base text-muted">
                Відгуків поки немає — будьте першим.
              </p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
