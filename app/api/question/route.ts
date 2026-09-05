import { NextResponse } from "next/server";
import { BOOK } from "@/config/book";
import { escapeHtml } from "@/lib/escape";

export const runtime = "nodejs";

type QuestionPayload = {
  name: string;
  contact: string;
  question: string;
  website?: string;
};

const REQUIRED_FIELDS: Array<keyof QuestionPayload> = [
  "name",
  "contact",
  "question",
];

const nowTimestamp = () =>
  new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kiev" });

const getEnv = (key: string) => process.env[key];

const questionRows = (payload: QuestionPayload) => [
  ["Імʼя", payload.name],
  ["Контакт", payload.contact],
  ["Питання", payload.question],
  ["Час", nowTimestamp()],
];

async function sendTelegram(payload: QuestionPayload) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getEnv("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    return false;
  }

  const text = [
    `Нове питання щодо замовлення (${BOOK.title})`,
    ...questionRows(payload).map(([label, value]) => `${label}: ${value}`),
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

async function sendEmail(payload: QuestionPayload) {
  const apiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("RESEND_FROM_EMAIL");
  const to = getEnv("RESEND_TO_EMAIL");

  if (!apiKey || !from || !to) {
    return false;
  }

  const html = `
    <h2>Нове питання щодо замовлення</h2>
    <ul>
      ${questionRows(payload)
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
      subject: `Питання щодо замовлення книги «${BOOK.title}»`,
      html,
    }),
  });

  return response.ok;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<QuestionPayload>;

    // Honeypot: бот заповнив приховане поле — тихо підтверджуємо й нічого не шлемо.
    if (payload.website) {
      return NextResponse.json({ ok: true });
    }

    for (const field of REQUIRED_FIELDS) {
      if (!payload[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 },
        );
      }
    }

    const normalized = payload as QuestionPayload;

    const [telegramOk, emailOk] = await Promise.all([
      sendTelegram(normalized).catch(() => false),
      sendEmail(normalized).catch(() => false),
    ]);

    return NextResponse.json({
      ok: true,
      notifications: {
        telegram: telegramOk,
        email: emailOk,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
