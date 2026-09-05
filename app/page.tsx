import Image from "next/image";
import LeafVine from "@/components/LeafVine";
import OrderForm from "@/components/OrderForm";
import QuestionModal from "@/components/QuestionModal";
import {
  ABOUT,
  BOOK,
  CONTENT_BLOCK,
  QUESTION_BLOCK,
  REVIEWS,
  REVIEWS_LINK,
} from "@/config/book";

const navItems = [
  { href: "#about", label: "Про книгу" },
  { href: "#order", label: "Замовити" },
  ...(REVIEWS.length > 0 ? [{ href: "#reviews", label: "Відгуки" }] : []),
  { href: "#links", label: "Посилання" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <p className="font-display text-2xl leading-none text-accent-deep sm:text-3xl">
            {BOOK.title}
          </p>
          <nav className="hidden items-center gap-8 text-base text-muted md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                className="transition hover:text-accent"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

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

        {REVIEWS.length > 0 ? (
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
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {REVIEWS.map((review) => (
                  <article
                    key={review.quote}
                    className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_16px_36px_-30px_rgba(14,74,46,0.8)]"
                  >
                    <p className="text-sm leading-relaxed text-muted">
                      {review.quote}
                    </p>
                    <p className="mt-auto pt-5 font-display text-lg text-accent-deep">
                      {review.author}
                    </p>
                  </article>
                ))}
              </div>
              {REVIEWS_LINK ? (
                <div className="mt-8 flex justify-center">
                  <a
                    href={REVIEWS_LINK}
                    className="rounded-xl border border-blue/30 bg-blue-soft px-6 py-3 text-sm font-semibold text-blue transition hover:border-blue/60"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Читати більше відгуків
                  </a>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section id="links">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <p className="text-sm uppercase tracking-[0.22em] text-accent">
              Посилання
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
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

              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 md:p-7">
                <h2 className="font-display text-3xl text-accent-deep">
                  {CONTENT_BLOCK.heading}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {CONTENT_BLOCK.text}
                </p>
                <div className="mt-auto grid gap-3 pt-6 text-sm">
                  {CONTENT_BLOCK.links.map((link) => (
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
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-6 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {BOOK.title}
          </span>
        </div>
      </footer>
    </div>
  );
}
