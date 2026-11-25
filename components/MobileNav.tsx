"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type NavItem = { href: string; label: string; isCurrent: boolean };

/**
 * «Гамбургер» для вузьких екранів: кнопка в шапці й випадна панель під нею.
 * Панель закривається пунктом меню, Escape, кліком поза шапкою або
 * повторним натисканням кнопки.
 */
export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const header = rootRef.current?.closest("header");
      if (header && !header.contains(event.target as Node)) setOpen(false);
    };
    // Розгорнули екран до десктопа — меню там уже в шапці, панель зайва.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Закрити меню" : "Відкрити меню"}
        onClick={() => setOpen((value) => !value)}
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-accent-deep transition hover:bg-accent-soft"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          <path
            d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label="Меню"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-white shadow-[0_24px_40px_-30px_rgba(14,74,46,0.6)]"
      >
        <ul className="mx-auto w-full max-w-6xl px-6 py-2">
          {items.map((item) => (
            <li key={item.href} className="border-b border-line last:border-b-0">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={item.isCurrent ? "page" : undefined}
                className={`block py-3.5 text-lg ${
                  item.isCurrent
                    ? "font-semibold text-accent"
                    : "text-foreground transition hover:text-accent"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
