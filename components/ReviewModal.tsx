"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { REVIEW_FORM, REVIEW_LIMITS } from "@/config/book";

const COOLDOWN_SECONDS = 60;

const EMPTY_FORM = { name: "", text: "", website: "" };

const fieldClass =
  "h-11 rounded-lg border border-line bg-white px-3 text-foreground transition focus:border-accent";

export default function ReviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cooldown > 0 || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Review failed");
      }

      setStatus("success");
      setForm(EMPTY_FORM);
      setCooldown(COOLDOWN_SECONDS);
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
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
        className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-16px_rgba(20,108,67,0.9)] transition hover:bg-accent-hover"
      >
        {REVIEW_FORM.heading}
      </button>

      {isOpen ? (
        <Modal
          eyebrow="Відгук"
          title={REVIEW_FORM.heading}
          onClose={() => setIsOpen(false)}
        >
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {REVIEW_FORM.text}
          </p>

          <form onSubmit={submitReview} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Ваше імʼя
              <input
                className={fieldClass}
                value={form.name}
                maxLength={REVIEW_LIMITS.name}
                autoComplete="name"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Так, як його підписати на сайті"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Відгук
              <textarea
                className="min-h-[160px] rounded-lg border border-line bg-white px-3 py-2 text-foreground transition focus:border-accent"
                value={form.text}
                maxLength={REVIEW_LIMITS.text}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, text: event.target.value }))
                }
                placeholder="Що вам запам'яталося, що відгукнулося, кому б ви порадили книгу"
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
              disabled={cooldown > 0 || isSubmitting}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Надсилаємо..."
                : cooldown > 0
                  ? `Можна відправити через ${cooldown} с`
                  : "Надіслати відгук"}
            </button>

            {status === "success" ? (
              <p className="text-sm font-medium text-accent">
                {REVIEW_FORM.successText}
              </p>
            ) : null}
            {status === "error" ? (
              <p className="text-sm font-medium text-red">
                Не вдалося надіслати відгук. Спробуйте ще раз.
              </p>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </>
  );
}
