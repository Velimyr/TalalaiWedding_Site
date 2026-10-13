"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import {
  BOOK,
  GIFT,
  GIFT_LIMITS,
  HAS_PAYMENT_URL,
  IS_PREORDER,
  ORDER_KINDS,
  ORDER_SUCCESS_TEXT,
  PAYMENT_METHODS,
  PREORDER_SUCCESS_TEXT,
  PREORDER_TEXT,
  VARIANTS,
  variantById,
  variantOptionLabel,
  type OrderKind,
  type PaymentMethodId,
  type VariantId,
} from "@/config/book";
import { closePaymentTab, goToPayment, openPaymentTab } from "@/lib/payment";

/** Порожній рядок — покупець ще не обрав спосіб оплати. */
type PaymentSelection = PaymentMethodId | "";

type OrderForm = {
  kind: OrderKind;
  variant: VariantId;
  contact: string;
  city: string;
  office: string;
  phone: string;
  fullName: string;
  paymentMethod: PaymentSelection;
  /** Лише для подарунка бібліотеці. */
  quantity: string;
  library: string;
};

const EMPTY_FORM: OrderForm = {
  kind: "self",
  variant: VARIANTS[0].id,
  contact: "",
  city: "",
  office: "",
  phone: "",
  fullName: "",
  paymentMethod: "",
  quantity: "1",
  library: "",
};

const fieldClass =
  "h-11 rounded-lg border border-line bg-white px-3 text-foreground transition focus:border-accent";

/**
 * Подарунок оплачується лише онлайн і без доставки, тому на сервер іде
 * тільки те, що стосується обраного режиму: поля доставки, які покупець
 * міг заповнити до перемикання, у подарунок не потрапляють.
 */
const toPayload = (form: OrderForm) =>
  form.kind === "gift"
    ? {
        kind: form.kind,
        variant: form.variant,
        fullName: form.fullName,
        contact: form.contact,
        quantity: Number(form.quantity),
        library: form.library,
        paymentMethod: "online",
      }
    : {
        kind: form.kind,
        variant: form.variant,
        fullName: form.fullName,
        contact: form.contact,
        phone: form.phone,
        city: form.city,
        office: form.office,
        paymentMethod: form.paymentMethod,
      };

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [orderMeta, setOrderMeta] = useState<{
    orderId: string;
    kind: OrderKind;
    isOnline: boolean;
  } | null>(null);
  const [needsManualPayment, setNeedsManualPayment] = useState(false);
  const [form, setForm] = useState<OrderForm>(EMPTY_FORM);

  const isGift = form.kind === "gift";
  const isOnline = isGift || form.paymentMethod === "online";

  const price = useMemo(
    () => variantById(form.variant)?.price ?? 0,
    [form.variant],
  );

  const setKind = (kind: OrderKind) => {
    setForm((prev) => ({ ...prev, kind }));
  };

  const onChange =
    (field: keyof OrderForm) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setNeedsManualPayment(false);

    // Вкладку оплати відкриваємо синхронно, до будь-якого await.
    const paymentTab = isOnline ? openPaymentTab() : null;

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (!response.ok) {
        throw new Error("Order failed");
      }

      const responseJson = (await response.json()) as { orderId: string };
      setStatus("success");
      setOrderMeta({
        orderId: responseJson.orderId,
        kind: form.kind,
        isOnline,
      });

      if (isOnline) {
        goToPayment(paymentTab, () => setNeedsManualPayment(true));
      }

      // Режим лишається тим самим: хто дарував, імовірно, дарує й далі.
      setForm({ ...EMPTY_FORM, kind: form.kind });
    } catch (error) {
      console.error(error);
      setStatus("error");
      closePaymentTab(paymentTab);
    } finally {
      setIsSubmitting(false);
    }
  };

  const successText =
    orderMeta?.kind === "gift"
      ? GIFT.successText
      : IS_PREORDER
        ? PREORDER_SUCCESS_TEXT
        : ORDER_SUCCESS_TEXT;

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-[0_18px_40px_-28px_rgba(20,108,67,0.55)] sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">
            Замовлення книги
          </p>
          <h3 className="font-display text-3xl text-accent-deep">
            Оформити замовлення
          </h3>
        </div>
        <div className="rounded-2xl border border-red/25 bg-red-soft px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            {isGift ? "За примірник" : "Вартість"}
          </p>
          <p className="text-xl font-semibold text-red">{price} грн</p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Для кого книга"
        className="mb-6 grid gap-3 sm:grid-cols-2"
      >
        {ORDER_KINDS.map((kind) => {
          const isActive = form.kind === kind.id;
          return (
            <button
              key={kind.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setKind(kind.id)}
              className={`rounded-xl border px-4 py-3 text-base font-semibold transition ${
                isActive
                  ? "border-accent bg-accent text-white shadow-[0_12px_24px_-16px_rgba(20,108,67,0.9)]"
                  : "border-accent/30 bg-white text-accent-deep hover:border-accent/60"
              }`}
            >
              {kind.label}
            </button>
          );
        })}
      </div>

      {isGift ? (
        <p className="mb-6 text-base leading-relaxed text-muted">{GIFT.text}</p>
      ) : null}

      {IS_PREORDER ? (
        <div className="mb-6 rounded-xl border border-blue/30 bg-blue-soft px-4 py-3 text-sm text-blue">
          {isGift ? GIFT.preorderNote : PREORDER_TEXT}
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-4">
        <div className={isGift ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
          <label className="grid gap-2 text-sm font-medium">
            Варіант замовлення
            <select
              className={fieldClass}
              value={form.variant}
              onChange={onChange("variant")}
              required
            >
              {VARIANTS.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variantOptionLabel(variant)}
                </option>
              ))}
            </select>
          </label>
          {isGift ? (
            <label className="grid gap-2 text-sm font-medium">
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
          ) : null}
        </div>

        <label className="grid gap-2 text-sm font-medium">
          Контакт для звʼязку
          <input
            className={fieldClass}
            value={form.contact}
            onChange={onChange("contact")}
            placeholder="Telegram / Facebook / Телефон"
            required
          />
        </label>

        {isGift ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              Ваше імʼя
              <input
                className={fieldClass}
                value={form.fullName}
                onChange={onChange("fullName")}
                autoComplete="name"
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
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                ПІБ отримувача
                <input
                  className={fieldClass}
                  value={form.fullName}
                  onChange={onChange("fullName")}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Номер телефону
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={onChange("phone")}
                  type="tel"
                  pattern="^(\+?380|0)\d{9}$"
                  title="Формат: +380XXXXXXXXX або 0XXXXXXXXX"
                  placeholder="+380XXXXXXXXX"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Місто / Село
                <input
                  className={fieldClass}
                  value={form.city}
                  onChange={onChange("city")}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {BOOK.deliveryOfficeLabel}
                <input
                  className={fieldClass}
                  value={form.office}
                  onChange={onChange("office")}
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Спосіб оплати
              <select
                className={fieldClass}
                value={form.paymentMethod}
                onChange={onChange("paymentMethod")}
                required
              >
                <option value="" disabled>
                  Оберіть спосіб оплати
                </option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Надсилаємо..."
            : isGift
              ? HAS_PAYMENT_URL
                ? "Подарувати і оплатити"
                : "Подарувати книгу"
              : form.paymentMethod === "online"
                ? "Замовити і оплатити"
                : "Замовити книгу"}
        </button>

        {status === "error" ? (
          <p className="text-sm font-medium text-red">
            Не вдалося надіслати замовлення. Будь ласка, спробуйте ще раз.
          </p>
        ) : null}
      </form>

      {orderMeta ? (
        <Modal
          eyebrow="Замовлення збережено"
          title={
            orderMeta.kind === "gift"
              ? "Дякуємо за подарунок!"
              : "Дякуємо за замовлення!"
          }
          onClose={() => setOrderMeta(null)}
          size="lg"
        >
          <div className="mt-6 space-y-4 text-sm text-muted">
            <p>{successText}</p>
            {orderMeta.isOnline ? (
              <p className="font-semibold text-red">
                {orderMeta.kind === "gift" && !HAS_PAYMENT_URL
                  ? "Ми звʼяжемося з вами, щоб узгодити оплату."
                  : "Не забудьте виконати оплату замовлення."}
              </p>
            ) : null}
            <div className="rounded-xl border border-line bg-surface px-4 py-3 text-foreground">
              Номер замовлення:{" "}
              <span className="font-semibold text-accent-deep">
                {orderMeta.orderId}
              </span>
            </div>
          </div>
          {orderMeta.isOnline && HAS_PAYMENT_URL && needsManualPayment ? (
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
