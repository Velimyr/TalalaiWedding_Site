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

/**
 * Канали доставки навмисно не валять замовлення. Але мовчати вони теж
 * не мають: без логів «не налаштовано», «API відмовив» і «мережа впала»
 * виглядають однаково — просто notifications.<канал> === false.
 * Токени в лог не потрапляють: пишемо лише статус і тіло відповіді.
 */
const runChannel = (name: string, run: () => Promise<boolean>) =>
  run().catch((error) => {
    console.error(`[${name}] канал впав:`, error);
    return false;
  });

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
    console.warn(
      "[google-sheets] пропущено: не задані GOOGLE_SHEETS_SHEET_ID / _CLIENT_EMAIL / _PRIVATE_KEY",
    );
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
    console.warn(
      "[telegram] пропущено: не задані TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID",
    );
    return false;
  }

  // Без parse_mode — тоді екранування розмітки не потрібне.
  const text = [
    `Нове замовлення «${BOOK.title}» #${orderId}`,
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

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[telegram] API відмовив: HTTP ${response.status} ${body.slice(0, 400)}`,
    );
    return false;
  }

  return true;
}

async function sendEmail(orderId: string, payload: OrderPayload) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM_EMAIL");
  const to = getEnv("RESEND_TO_EMAIL");

  if (!apiKey || !from || !to) {
    console.warn(
      "[email] пропущено: не задані RESEND_API_KEY / RESEND_FROM_EMAIL / RESEND_TO_EMAIL",
    );
    return false;
  }

  const html = `
    <h2>Нове замовлення «${escapeHtml(BOOK.title)}» #${escapeHtml(orderId)}</h2>
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
      subject: `Нове замовлення «${BOOK.title}» #${orderId}`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(
      `[email] Resend відмовив: HTTP ${response.status} ${body.slice(0, 400)}`,
    );
    return false;
  }

  return true;
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
      runChannel("google-sheets", () => appendToGoogleSheet(orderId, normalized)),
      runChannel("telegram", () => sendTelegram(orderId, normalized)),
      runChannel("email", () => sendEmail(orderId, normalized)),
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
