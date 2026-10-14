import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import LeafVine from "@/components/LeafVine";
import OrderForm from "@/components/OrderForm";
import QuestionModal from "@/components/QuestionModal";
import ReviewModal from "@/components/ReviewModal";
import ReviewGrid from "@/components/ReviewGrid";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  ABOUT,
  AUTHOR,
  BOOK,
  CONTENT_BLOCK,
  QUESTION_BLOCK,
  REVIEWS,
  REVIEWS_PREVIEW_COUNT,
  VIDEO_BLOCK,
} from "@/config/book";

/**
 * Фото авторки може ще не лежати в public/ — тоді замість нього ініціали,
 * а не зламана картинка. Сторінка статична, тож перевірка — на етапі збірки.
 */
const HAS_AUTHOR_PHOTO = existsSync(
  path.join(process.cwd(), "public", AUTHOR.photoSrc),
);

const AUTHOR_INITIALS = AUTHOR.name
  .split(" ")
  .map((word) => word[0])
  .join("");

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,108,67,0.12),_transparent_58%)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[140px] select-none md:block 2xl:w-[160px]"
          >
            <LeafVine />
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 md:pl-[150px] lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24 2xl:pl-[172px]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-blue">
                {BOOK.tagline}
              </p>
              <h1 className="font-display text-5xl leading-[1.05] text-accent-deep sm:text-6xl">
                {BOOK.title}
              </h1>
              {BOOK.author ? (
                <p className="text-lg font-semibold text-muted">
                  {BOOK.author}
                </p>
              ) : null}
              <p className="max-w-xl text-lg leading-relaxed text-muted">
                {BOOK.shortDescription}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-4">
                <a
                  href="#order"
                  className="rounded-xl bg-accent px-8 py-4 text-base font-semibold text-white shadow-[0_16px_30px_-16px_rgba(20,108,67,0.9)] transition hover:bg-accent-hover"
                >
                  Замовити книгу
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[260px] sm:w-[300px] lg:w-[320px]">
                <div className="absolute -inset-4 rounded-[30px] border-2 border-accent/30 sm:-inset-6" />
                <div className="absolute -inset-4 rounded-[30px] border-t-2 border-red/60 sm:-inset-6" />
                <Image
                  src={BOOK.coverSrc}
                  alt={BOOK.coverAlt}
                  width={BOOK.coverWidth}
                  height={BOOK.coverHeight}
                  className="relative w-full rounded-2xl border border-line object-contain shadow-[0_30px_60px_-35px_rgba(14,74,46,0.75)]"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-4xl px-6 py-16">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.22em] text-accent">
                  Про книгу
                </p>
                <h2 className="font-display text-4xl text-accent-deep">
                  {ABOUT.heading}
                </h2>
              </div>
              <div className="space-y-4 text-base leading-relaxed text-muted">
                {ABOUT.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 rounded-2xl border border-line bg-white p-6 shadow-[0_16px_36px_-30px_rgba(14,74,46,0.8)] sm:grid-cols-[180px_1fr] sm:items-center sm:gap-8 sm:p-8">
              <div className="relative mx-auto aspect-[5/7] w-40 overflow-hidden rounded-xl border border-line bg-surface-strong sm:mx-0 sm:w-full">
                {HAS_AUTHOR_PHOTO ? (
                  <Image
                    src={AUTHOR.photoSrc}
                    alt={AUTHOR.name}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full items-center justify-center font-display text-5xl text-accent-deep/60"
                  >
                    {AUTHOR_INITIALS}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.22em] text-accent">
                  {AUTHOR.heading}
                </p>
                <h3 className="font-display text-3xl text-accent-deep">
                  {AUTHOR.name}
                </h3>
                <p className="pt-1 text-base leading-relaxed text-muted">
                  {AUTHOR.text}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="order" className="relative overflow-hidden border-b border-line">
          {/* та сама смуга й той самий відступ від краю сторінки, що і в hero */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[140px] select-none md:block 2xl:w-[160px]"
          >
            <LeafVine />
          </div>
          <div className="relative mx-auto w-full max-w-6xl px-6 py-16 md:pl-[150px] 2xl:pl-[172px]">
            <div className="mx-auto w-full max-w-3xl">
              <OrderForm />
            </div>
          </div>
        </section>

        <section id="reviews" className="border-b border-line bg-surface">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.22em] text-accent">
                Відгуки
              </p>
              <h2 className="font-display text-4xl text-accent-deep">
                Враження читачів
              </h2>
            </div>
            {REVIEWS.length > 0 ? (
              <div className="mt-8">
                <ReviewGrid
                  reviews={REVIEWS}
                  count={REVIEWS_PREVIEW_COUNT}
                  shuffle
                />
              </div>
            ) : (
              <p className="mt-6 text-base text-muted">
                Відгуків поки немає — будьте першим.
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {REVIEWS.length > REVIEWS_PREVIEW_COUNT ? (
                <Link
                  href="/reviews"
                  className="rounded-xl border border-blue/30 bg-blue-soft px-6 py-3 text-sm font-semibold text-blue transition hover:border-blue/60"
                >
                  Усі відгуки ({REVIEWS.length})
                </Link>
              ) : null}
              <ReviewModal />
            </div>
          </div>
        </section>

        <section id="links">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <p className="text-sm uppercase tracking-[0.22em] text-accent">
              Посилання
            </p>
            {/* Три блоки: на планшеті два в ряд, а останній — на всю ширину. */}
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 md:p-7">
                <h2 className="font-display text-3xl text-accent-deep">
                  {QUESTION_BLOCK.heading}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {QUESTION_BLOCK.text}
                </p>
                <div className="mt-auto grid gap-3 pt-6 text-sm">
                  <QuestionModal />
                </div>
              </div>

              {[CONTENT_BLOCK, VIDEO_BLOCK].map((block, index, blocks) => (
                <div
                  key={block.heading}
                  className={`flex h-full flex-col rounded-2xl border border-line bg-surface p-6 md:p-7 ${
                    index === blocks.length - 1 ? "md:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  <h2 className="font-display text-3xl text-accent-deep">
                    {block.heading}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {block.text}
                  </p>
                  <div className="mt-auto grid gap-3 pt-6 text-sm">
                    {block.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="rounded-xl border border-blue/30 bg-blue-soft px-4 py-3 text-center font-semibold text-blue transition hover:border-blue/60"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
