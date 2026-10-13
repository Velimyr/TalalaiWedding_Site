import { NextResponse } from "next/server";
import { BOOK } from "@/config/book";
import { nowTimestamp, runChannel, sendEmail, sendTelegram } from "@/lib/notify";

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

const questionRows = (payload: QuestionPayload) =>
  [
    ["Імʼя", payload.name],
    ["Контакт", payload.contact],
    ["Питання", payload.question],
    ["Час", nowTimestamp()],
  ] as const;

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

    const rows = questionRows(payload as QuestionPayload);

    const [telegramOk, emailOk] = await Promise.all([
      runChannel("telegram", () =>
        sendTelegram(`Нове питання щодо замовлення «${BOOK.title}»`, rows),
      ),
      runChannel("email", () =>
        sendEmail(
          `Питання щодо замовлення книги «${BOOK.title}»`,
          `Нове питання щодо замовлення «${BOOK.title}»`,
          rows,
        ),
      ),
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
