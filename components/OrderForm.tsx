"use client";

import { useMemo, useState } from "react";
import {
  BOOK,
  HAS_PAYMENT_URL,
  IS_PREORDER,
  ORDER_SUCCESS_TEXT,
  PAYMENT_METHODS,
  PREORDER_SUCCESS_TEXT,
  PREORDER_TEXT,
  VARIANTS,
  variantById,
  variantOptionLabel,
  type PaymentMethodId,
  type VariantId,
} from "@/config/book";

/** Порожній рядок — покупець ще не обрав спосіб оплати. */
type PaymentSelection = PaymentMethodId | "";

type OrderPayload = {
  variant: VariantId;
  contact: string;
  city: string;
  office: string;
  phone: string;
  fullName: string;
  paymentMethod: PaymentSelection;
};

const EMPTY_FORM: OrderPayload = {
  variant: VARIANTS[0].id,
  contact: "",
  city: "",
  office: "",
  phone: "",
  fullName: "",
  paymentMethod: "",
};

const fieldClass =
  "h-11 rounded-lg border border-line bg-white px-3 text-foreground transition focus:border-accent";

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [orderMeta, setOrderMeta] = useState<{
    orderId: string;
    paymentMethod: PaymentSelection;
  } | null>(null);
  const [needsManualPayment, setNeedsManualPayment] = useState(false);
  const [form, setForm] = useState<OrderPayload>(EMPTY_FORM);

  const price = useMemo(
    () => variantById(form.variant)?.price ?? 0,
    [form.variant],
  );

  const onChange =
    (field: keyof OrderPayload) =>
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

    let paymentWindow: Window | null = null;
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

    // Вкладку оплати відкриваємо синхронно, до будь-якого await —
    // інакше браузер втратить звʼязок із жестом користувача і заблокує попап.
    if (form.paymentMethod === "online" && HAS_PAYMENT_URL && !isIOS) {
      paymentWindow = window.open("about:blank", "_blank");
      if (paymentWindow) {
        paymentWindow.opener = null;
      }
    }

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Order failed");
      }

      const responseJson = (await response.json()) as { orderId: string };
      setStatus("success");
      setOrderMeta({
        orderId: responseJson.orderId,
        paymentMethod: form.paymentMethod,
      });

      if (form.paymentMethod === "online" && HAS_PAYMENT_URL) {
        if (isIOS) {
          // iOS Safari блокує відкладені попапи — переходимо в тій самій вкладці.
          window.location.href = BOOK.paymentUrl;
        } else if (paymentWindow && !paymentWindow.closed) {
          try {
            paymentWindow.location.href = BOOK.paymentUrl;
            window.setTimeout(() => {
              try {
                const href = paymentWindow.location.href;
                if (href === "about:blank" || href === "about:blank#") {
                  setNeedsManualPayment(true);
                }
              } catch {
                // Cross-origin читання впало → навігація успішна.
              }
            }, 1000);
          } catch {
            setNeedsManualPayment(true);
          }
        } else {
          setNeedsManualPayment(true);
        }
      }

      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(error);
      setStatus("error");
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Вартість
          </p>
          <p className="text-xl font-semibold text-red">{price} грн</p>
        </div>
      </div>

      {IS_PREORDER ? (
        <div className="mb-6 rounded-xl border border-blue/30 bg-blue-soft px-4 py-3 text-sm text-blue">
          {PREORDER_TEXT}
        </div>
      ) : null}

      <form onSubmit={submit} className="grid gap-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Надсилаємо..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-accent-deep/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(14,74,46,0.6)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-accent">
                  Замовлення збережено
                </p>
                <h4 className="font-display text-3xl text-accent-deep">
                  Дякуємо за замовлення!
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setOrderMeta(null)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-muted transition hover:text-accent"
              >
                Закрити
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm text-muted">
              <p>{IS_PREORDER ? PREORDER_SUCCESS_TEXT : ORDER_SUCCESS_TEXT}</p>
              {orderMeta.paymentMethod === "online" ? (
                <p className="font-semibold text-red">
                  Не забудьте виконати оплату замовлення.
                </p>
              ) : null}
              <div className="rounded-xl border border-line bg-surface px-4 py-3 text-foreground">
                Номер замовлення:{" "}
                <span className="font-semibold text-accent-deep">
                  {orderMeta.orderId}
                </span>
              </div>
            </div>
            {orderMeta.paymentMethod === "online" && needsManualPayment ? (
              <a
                href={BOOK.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-hover"
              >
                Відкрити оплату
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
