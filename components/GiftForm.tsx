"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import {
  BOOK,
  GIFT,
  GIFT_LIMITS,
  HAS_PAYMENT_URL,
  IS_PREORDER,
  VARIANTS,
} from "@/config/book";
import { closePaymentTab, goToPayment, openPaymentTab } from "@/lib/payment";

const EMPTY_FORM = {
  name: "",
  contact: "",
  quantity: "1",
  library: "",
  website: "",
};

const fieldClass =
  "h-11 rounded-lg border border-line bg-white px-3 text-foreground transition focus:border-accent";

/**
 * «Подарунок бібліотеці»: оплата лише онлайн і без доставки — книга
 * йде не платнику, а бібліотеці. Контакт платника обовʼязковий, щоб
 * повідомити, куди і коли книгу передали.
 */
export default function GiftForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [giftId, setGiftId] = useState<string | null>(null);
  const [needsManualPayment, setNeedsManualPayment] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const onChange =
    (field: keyof typeof EMPTY_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setNeedsManualPayment(false);

    // Вкладку оплати відкриваємо синхронно, до будь-якого await.
    const paymentTab = openPaymentTab();

    try {
      const response = await fetch("/api/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });

      if (!response.ok) {
        throw new Error("Gift failed");
      }

      const responseJson = (await response.json()) as { giftId: string };
      setGiftId(responseJson.giftId);
      goToPayment(paymentTab, () => setNeedsManualPayment(true));
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(error);
      setStatus("error");
      closePaymentTab(paymentTab);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_18px_40px_-28px_rgba(20,108,67,0.55)] sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">
            Для бібліотек
          </p>
          <h2 className="font-display text-3xl text-accent-deep sm:text-4xl">
            {GIFT.heading}
          </h2>
        </div>
        <div className="rounded-2xl border border-red/25 bg-red-soft px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            За примірник
          </p>
          <p className="text-xl font-semibold text-red">
            {VARIANTS[0].price} грн
          </p>
        </div>
      </div>

      <p className="mb-6 text-base leading-relaxed text-muted">{GIFT.text}</p>

      {IS_PREORDER ? (
        <div className="mb-6 rounded-xl border border-blue/30 bg-blue-soft px-4 py-3 text-sm text-blue">
          {GIFT.preorderNote}
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Ваше імʼя
            <input
              className={fieldClass}
              value={form.name}
              maxLength={GIFT_LIMITS.name}
              autoComplete="name"
              onChange={onChange("name")}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Контакт для звʼязку
            <input
              className={fieldClass}
              value={form.contact}
              maxLength={GIFT_LIMITS.contact}
              onChange={onChange("contact")}
              placeholder="Telegram / Facebook / Телефон"
              required
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium md:max-w-[50%] md:pr-2">
          Кількість примірників
          <input
            className={fieldClass}
            value={form.quantity}
            onChange={onChange("quantity")}
            type="number"
            inputMode="numeric"
            min={1}
            max={GIFT_LIMITS.quantity}
            step={1}
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          <span>
            Якій бібліотеці передати{" "}
            <span className="font-normal text-muted">(необовʼязково)</span>
          </span>
          <textarea
            className="min-h-[110px] rounded-lg border border-line bg-white px-3 py-2 text-foreground transition focus:border-accent"
            value={form.library}
            maxLength={GIFT_LIMITS.library}
            onChange={onChange("library")}
            placeholder="Напр.: Публічна бібліотека с. …, вул. …, контактна особа — …, тел. …"
            aria-describedby="gift-library-hint"
          />
          <span
            id="gift-library-hint"
            className="text-xs font-normal leading-relaxed text-muted"
          >
            {GIFT.libraryHint}
          </span>
        </label>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={form.website}
          onChange={onChange("website")}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Надсилаємо..."
            : HAS_PAYMENT_URL
              ? "Подарувати і оплатити"
              : "Подарувати книгу"}
        </button>

        {status === "error" ? (
          <p className="text-sm font-medium text-red">
            Не вдалося надіслати заявку. Будь ласка, спробуйте ще раз.
          </p>
        ) : null}
      </form>

      {giftId !== null ? (
        <Modal
          eyebrow="Подарунок збережено"
          title="Дякуємо за подарунок!"
          onClose={() => setGiftId(null)}
          size="lg"
        >
          <div className="mt-6 space-y-4 text-sm text-muted">
            <p>{GIFT.successText}</p>
            <p className="font-semibold text-red">
              {HAS_PAYMENT_URL
                ? "Не забудьте виконати оплату подарунка."
                : "Ми звʼяжемося з вами, щоб узгодити оплату."}
            </p>
            <div className="rounded-xl border border-line bg-surface px-4 py-3 text-foreground">
              Номер подарунка:{" "}
              <span className="font-semibold text-accent-deep">{giftId}</span>
            </div>
          </div>
          {HAS_PAYMENT_URL && needsManualPayment ? (
            <a
              href={BOOK.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-hover"
            >
              Відкрити оплату
            </a>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
