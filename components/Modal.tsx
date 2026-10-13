"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Оболонка модальних вікон сайту: затемнення, картка, надрядок, заголовок
 * і кнопка «Закрити». Вміст — що завгодно.
 */
export default function Modal({
  eyebrow,
  title,
  onClose,
  size = "md",
  children,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  size?: "md" | "lg";
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-accent-deep/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full rounded-3xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(14,74,46,0.6)] ${
          size === "lg" ? "max-w-2xl sm:p-8" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {eyebrow}
            </p>
            <h4 className="font-display text-3xl text-accent-deep">{title}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-accent"
          >
            Закрити
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
