import { google } from "googleapis";
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
import { escapeHtml } from "@/lib/escape";

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

const nowTimestamp = () =>
  new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kiev" });

const getEnv = (key: string) => process.env[key];

const orderRows = (payload: OrderPayload) => [
  ["Варіант", variantById(payload.variant)?.label ?? payload.variant],
  ["Оплата", paymentLabelById(payload.paymentMethod) ?? payload.paymentMethod],
  ["ПІБ", payload.fullName],
  ["Телефон", payload.phone],
  ["Контакт", payload.contact],
  ["Місто", payload.city],
  [`Відділення ${BOOK.deliveryService}`, payload.office],
  ["Час", nowTimestamp()],
];

async function appendToGoogleSheet(orderId: string, payload: OrderPayload) {
  const sheetId = getEnv("GOOGLE_SHEETS_SHEET_ID");
  const sheetName = getEnv("GOOGLE_SHEETS_SHEET_NAME") ?? "Orders";
  const clientEmail = getEnv("GOOGLE_SHEETS_CLIENT_EMAIL");
  const privateKey = getEnv("GOOGLE_SHEETS_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (!sheetId || !clientEmail || !privateKey) {
    return false;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const values = [
    [
      nowTimestamp(),
      orderId,
      variantById(payload.variant)?.label ?? payload.variant,
      paymentLabelById(payload.paymentMethod) ?? payload.paymentMethod,
      payload.fullName,
      payload.phone,
      payload.contact,
      payload.city,
      payload.office,
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return true;
}

async function sendTelegram(orderId: string, payload: OrderPayload) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getEnv("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    return false;
  }

  // Без parse_mode — тоді екранування розмітки не потрібне.
  const text = [
    `Нове замовлення #${orderId}`,
    ...orderRows(payload).map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );

  return response.ok;
}

async function sendEmail(orderId: string, payload: OrderPayload) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM_EMAIL");
  const to = getEnv("RESEND_TO_EMAIL");

  if (!apiKey || !from || !to) {
    return false;
  }

  const html = `
    <h2>Нове замовлення #${escapeHtml(orderId)}</h2>
    <ul>
      ${orderRows(payload)
        .map(
          ([label, value]) =>
            `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
        )
        .join("\n      ")}
    </ul>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Нове замовлення книги #${orderId}`,
      html,
    }),
  });

  return response.ok;
}

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

    const [sheetOk, telegramOk, emailOk] = await Promise.all([
      appendToGoogleSheet(orderId, normalized).catch(() => false),
      sendTelegram(orderId, normalized).catch(() => false),
      sendEmail(orderId, normalized).catch(() => false),
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
