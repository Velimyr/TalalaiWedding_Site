import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  BOOK,
  currentPrice,
  GIFT_LIMITS,
  PAYMENT_METHODS,
  paymentLabelById,
  variantById,
  type PaymentMethodId,
  type VariantId,
} from "@/config/book";
import {
  appendSheetRow,
  cleanText,
  nowTimestamp,
  runChannel,
  sendEmail,
  sendTelegram,
  type NotifyRow,
} from "@/lib/notify";

export const runtime = "nodejs";

/** Звичайне замовлення: книга їде покупцю. */
type SelfOrder = {
  kind: "self";
  variant: VariantId;
  contact: string;
  city: string;
  office: string;
  phone: string;
  fullName: string;
  paymentMethod: PaymentMethodId;
};

/** Подарунок бібліотеці: без доставки, оплата лише онлайн. */
type GiftOrder = {
  kind: "gift";
  variant: VariantId;
  contact: string;
  fullName: string;
  quantity: number;
  library: string;
  paymentMethod: "online";
};

type Order = SelfOrder | GiftOrder;

const SELF_REQUIRED_FIELDS = [
  "contact",
  "city",
  "office",
  "phone",
  "fullName",
] as const;

const GIFT_REQUIRED_FIELDS = ["contact", "fullName"] as const;

const LIBRARY_NOT_SET = "Не вказано — обрати самостійно";

const badRequest = (field: string) =>
  NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });

/**
 * Розбирає тіло запиту в замовлення потрібного типу або повертає назву
 * першого некоректного поля. Запити без kind — від старої версії форми —
 * вважаються звичайним замовленням.
 */
function parseOrder(payload: Record<string, unknown>): Order | string {
  const variant = cleanText(payload.variant);
  if (!variantById(variant)) return "variant";

  if (payload.kind === "gift") {
    for (const field of GIFT_REQUIRED_FIELDS) {
      if (!cleanText(payload[field])) return field;
    }
    const quantity = Number(payload.quantity);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > GIFT_LIMITS.quantity
    ) {
      return "quantity";
    }
    const library = cleanText(payload.library);
    if (library.length > GIFT_LIMITS.library) return "library";

    return {
      kind: "gift",
      variant: variant as VariantId,
      contact: cleanText(payload.contact),
      fullName: cleanText(payload.fullName),
      quantity,
      library,
      paymentMethod: "online",
    };
  }

  for (const field of SELF_REQUIRED_FIELDS) {
    if (!cleanText(payload[field])) return field;
  }
  const paymentMethod = cleanText(payload.paymentMethod);
  if (!PAYMENT_METHODS.some((method) => method.id === paymentMethod)) {
    return "paymentMethod";
  }

  return {
    kind: "self",
    variant: variant as VariantId,
    contact: cleanText(payload.contact),
    city: cleanText(payload.city),
    office: cleanText(payload.office),
    phone: cleanText(payload.phone),
    fullName: cleanText(payload.fullName),
    paymentMethod: paymentMethod as PaymentMethodId,
  };
}

const variantLabel = (order: Order) =>
  variantById(order.variant)?.label ?? order.variant;

const currentPriceOf = (id: VariantId) => {
  const variant = variantById(id);
  return variant ? currentPrice(variant) : 0;
};

/** Та сама сума, що підставляється в посилання на оплату. */
const orderAmount = (order: Order) =>
  currentPriceOf(order.variant) *
  (order.kind === "gift" ? order.quantity : 1);

const orderRows = (order: Order): NotifyRow[] =>
  order.kind === "gift"
    ? [
        ["Тип", "Подарунок бібліотеці"],
        ["Варіант", variantLabel(order)],
        ["Примірників", String(order.quantity)],
        ["Сума", `${orderAmount(order)} грн`],
        ["Оплата", paymentLabelById(order.paymentMethod) ?? order.paymentMethod],
        ["Платник", order.fullName],
        ["Контакт", order.contact],
        ["Бібліотека", order.library || LIBRARY_NOT_SET],
        ["Час", nowTimestamp()],
      ]
    : [
        ["Варіант", variantLabel(order)],
        ["Сума", `${orderAmount(order)} грн`],
        ["Оплата", paymentLabelById(order.paymentMethod) ?? order.paymentMethod],
        ["ПІБ", order.fullName],
        ["Телефон", order.phone],
        ["Контакт", order.contact],
        ["Місто", order.city],
        [`Відділення ${BOOK.deliveryService}`, order.office],
        ["Час", nowTimestamp()],
      ];

/**
 * Колонки: Час | № замовлення | Варіант | Спосіб оплати | ПІБ | Телефон |
 * Контакт | Місто | Відділення | Бібліотека
 *
 * Подарунок іде в той самий аркуш: у «Варіанті» — позначка й кількість,
 * доставка порожня, а бібліотека — в останній колонці, якої в звичайних
 * замовлень немає (тому старі рядки таблиці лишаються коректними).
 */
const sheetRow = (orderId: string, order: Order) =>
  order.kind === "gift"
    ? [
        nowTimestamp(),
        orderId,
        `🎁 Подарунок бібліотеці: ${variantLabel(order)} × ${order.quantity}`,
        paymentLabelById(order.paymentMethod) ?? order.paymentMethod,
        order.fullName,
        "",
        order.contact,
        "",
        "",
        order.library || LIBRARY_NOT_SET,
      ]
    : [
        nowTimestamp(),
        orderId,
        variantLabel(order),
        paymentLabelById(order.paymentMethod) ?? order.paymentMethod,
        order.fullName,
        order.phone,
        order.contact,
        order.city,
        order.office,
      ];

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const order = parseOrder(payload);

    if (typeof order === "string") {
      return badRequest(order);
    }

    const orderId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const heading =
      order.kind === "gift"
        ? `🎁 Подарунок бібліотеці «${BOOK.title}» #${orderId}`
        : `Нове замовлення «${BOOK.title}» #${orderId}`;
    const rows = orderRows(order);

    const [sheetOk, telegramOk, emailOk] = await Promise.all([
      runChannel("google-sheets", () =>
        appendSheetRow(
          process.env.GOOGLE_SHEETS_SHEET_NAME ?? "Orders",
          sheetRow(orderId, order),
        ),
      ),
      runChannel("telegram", () => sendTelegram(heading, rows)),
      runChannel("email", () => sendEmail(heading, heading, rows)),
    ]);

    return NextResponse.json({
      ok: true,
      orderId,
      notifications: {
        googleSheets: sheetOk,
        telegram: telegramOk,
        email: emailOk,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
