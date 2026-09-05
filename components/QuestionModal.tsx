"use client";

import { useEffect, useState } from "react";

const COOLDOWN_SECONDS = 60;

const fieldClass =
  "h-11 rounded-lg border border-line bg-white px-3 text-foreground transition focus:border-accent";

export default function QuestionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    question: "",
    website: "",
  });

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0) {
      return;
    }
    setStatus("idle");

    try {
      const response = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Question failed");
      }

      setStatus("success");
      setForm({ name: "", contact: "", question: "", website: "" });
      setCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-center text-sm font-semibold text-accent-deep transition hover:border-accent/60"
      >
        Задати питання щодо замовлення
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-accent-deep/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(14,74,46,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">
                  Запитання
                </p>
                <h4 className="font-display text-3xl text-accent-deep">
                  Задати питання
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-accent"
              >
                Закрити
              </button>
            </div>

            <form onSubmit={submitQuestion} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Імʼя
                <input
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Як з вами звʼязатися
                <input
                  className={fieldClass}
                  value={form.contact}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, contact: event.target.value }))
                  }
                  placeholder="Telegram / Facebook / Телефон"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Суть питання
                <textarea
                  className="min-h-[120px] rounded-lg border border-line bg-white px-3 py-2 text-foreground transition focus:border-accent"
                  value={form.question}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      question: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                value={form.website}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, website: event.target.value }))
                }
              />

              <button
                type="submit"
                disabled={cooldown > 0}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cooldown > 0
                  ? `Можна відправити через ${cooldown} с`
                  : "Надіслати питання"}
              </button>

              {status === "success" ? (
                <p className="text-sm font-medium text-accent">
                  Дякуємо! Ми отримали ваше питання і відповімо якнайшвидше.
                </p>
              ) : null}
              {status === "error" ? (
                <p className="text-sm font-medium text-red">
                  Не вдалося надіслати питання. Спробуйте ще раз.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
