import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  BOOK,
  PAYMENT_METHODS,
  paymentLabelById,
  variantById,
  type PaymentMethodId,
  type VariantId,
} from "@/config/book";
import {
  appendSheetRow,
  nowTimestamp,
  runChannel,
  sendEmail,
  sendTelegram,
} from "@/lib/notify";

export const runtime = "nodejs";

type OrderPayload = {
  variant: VariantId;
  contact: string;
  city: string;
  office: string;
  phone: string;
  fullName: string;
  paymentMethod: PaymentMethodId;
};

const REQUIRED_FIELDS: Array<keyof OrderPayload> = [
  "variant",
  "contact",
  "city",
  "office",
  "phone",
  "fullName",
  "paymentMethod",
];

const orderRows = (payload: OrderPayload) =>
  [
    ["Варіант", variantById(payload.variant)?.label ?? payload.variant],
    ["Оплата", paymentLabelById(payload.paymentMethod) ?? payload.paymentMethod],
    ["ПІБ", payload.fullName],
    ["Телефон", payload.phone],
    ["Контакт", payload.contact],
    ["Місто", payload.city],
    [`Відділення ${BOOK.deliveryService}`, payload.office],
    ["Час", nowTimestamp()],
  ] as const;

/** Колонки: Час | № замовлення | Варіант | Спосіб оплати | ПІБ | Телефон | Контакт | Місто | Відділення */
const sheetRow = (orderId: string, payload: OrderPayload) => [
  nowTimestamp(),
  orderId,
  variantById(payload.variant)?.label ?? payload.variant,
  paymentLabelById(payload.paymentMethod) ?? payload.paymentMethod,
  payload.fullName,
  payload.phone,
  payload.contact,
  payload.city,
  payload.office,
];

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<OrderPayload>;

    for (const field of REQUIRED_FIELDS) {
      if (!payload[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 },
        );
      }
    }

    if (!variantById(payload.variant as string)) {
      return NextResponse.json(
        { error: "Missing field: variant" },
        { status: 400 },
      );
    }

    if (
      !PAYMENT_METHODS.some((method) => method.id === payload.paymentMethod)
    ) {
      return NextResponse.json(
        { error: "Missing field: paymentMethod" },
        { status: 400 },
      );
    }

    const orderId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const normalized = payload as OrderPayload;
    const heading = `Нове замовлення «${BOOK.title}» #${orderId}`;
    const rows = orderRows(normalized);

    const [sheetOk, telegramOk, emailOk] = await Promise.all([
      runChannel("google-sheets", () =>
        appendSheetRow(
          process.env.GOOGLE_SHEETS_SHEET_NAME ?? "Orders",
          sheetRow(orderId, normalized),
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
