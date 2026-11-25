import Link from "next/link";
import MobileNav, { type NavItem } from "@/components/MobileNav";
import { BOOK } from "@/config/book";

/**
 * Спільна шапка лендінгу й окремих сторінок.
 *
 * На лендінгу пункти меню — якорі поточної сторінки, на окремій сторінці
 * (галерея, відгуки) ті самі пункти мусять вести на головну: `/#about`.
 * «Відгуки» поза лендінгом ведуть одразу на повний список — /reviews.
 *
 * current — шлях окремої сторінки, на якій ми зараз: її пункт підсвічується.
 *
 * На десктопі (lg+) пункти стоять у шапці, нижче — ховаються в «гамбургер».
 */
export default function SiteHeader({
  variant = "home",
  current,
}: {
  variant?: "home" | "page";
  current?: "/gallery" | "/reviews";
}) {
  const isHome = variant === "home";
  const anchor = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  const navItems: NavItem[] = [
    { href: anchor("about"), label: "Про книгу" },
    { href: anchor("order"), label: "Замовити" },
    { href: isHome ? "#reviews" : "/reviews", label: "Відгуки" },
    { href: anchor("links"), label: "Посилання" },
    { href: "/gallery", label: "Фотогалерея" },
  ].map((item) => ({ ...item, isCurrent: !isHome && item.href === current }));

  return (
    <header
      className={`${isHome ? "sticky top-0" : "relative"} z-40 shrink-0 border-b border-line bg-white/85 backdrop-blur`}
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
        <nav className="hidden items-center gap-8 text-base text-muted lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={
                item.isCurrent
                  ? "font-semibold text-accent"
                  : "transition hover:text-accent"
              }
              aria-current={item.isCurrent ? "page" : undefined}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MobileNav items={navItems} />
      </div>
    </header>
  );
}
