import Link from "next/link";
import { BOOK, REVIEWS } from "@/config/book";

/**
 * Спільна шапка лендінгу й окремих сторінок.
 *
 * На лендінгу пункти меню — якорі поточної сторінки, на окремій сторінці
 * (галерея) ті самі пункти мусять вести на головну: `/#about`.
 */
export default function SiteHeader({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  const isHome = variant === "home";
  const anchor = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  const navItems = [
    { href: anchor("about"), label: "Про книгу" },
    { href: anchor("order"), label: "Замовити" },
    ...(REVIEWS.length > 0 ? [{ href: anchor("reviews"), label: "Відгуки" }] : []),
    { href: anchor("links"), label: "Посилання" },
    { href: "/gallery", label: "Фотогалерея" },
  ];

  return (
    <header
      className={`${isHome ? "sticky top-0" : ""} z-40 shrink-0 border-b border-line bg-white/85 backdrop-blur`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        {isHome ? (
          <p className="font-display text-2xl leading-none text-accent-deep sm:text-3xl">
            {BOOK.title}
          </p>
        ) : (
          <Link
            href="/"
            className="font-display text-2xl leading-none text-accent-deep transition hover:text-accent sm:text-3xl"
          >
            {BOOK.title}
          </Link>
        )}
        <nav className="hidden items-center gap-8 text-base text-muted md:flex">
          {navItems.map((item) => {
            const isCurrent = !isHome && item.href === "/gallery";
            return (
              <Link
                key={item.href}
                className={
                  isCurrent
                    ? "font-semibold text-accent"
                    : "transition hover:text-accent"
                }
                aria-current={isCurrent ? "page" : undefined}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
