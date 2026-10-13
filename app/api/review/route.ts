import { NextResponse } from "next/server";
import { BOOK, REVIEW_LIMITS } from "@/config/book";
import {
  cleanText,
  nowTimestamp,
  runChannel,
  sendEmail,
  sendTelegram,
} from "@/lib/notify";

export const runtime = "nodejs";

/**
 * Відгук на сайт сам не потрапляє: приходить у Telegram (і на пошту, якщо
 * вона налаштована), а на сторінку його додають руками в REVIEWS.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    // Honeypot: бот заповнив приховане поле — тихо підтверджуємо й нічого не шлемо.
    if (payload.website) {
      return NextResponse.json({ ok: true });
    }

    const name = cleanText(payload.name);
    const text = cleanText(payload.text);

    if (!name || name.length > REVIEW_LIMITS.name) {
      return NextResponse.json({ error: "Invalid field: name" }, { status: 400 });
    }
    if (!text || text.length > REVIEW_LIMITS.text) {
      return NextResponse.json({ error: "Invalid field: text" }, { status: 400 });
    }

    const heading = `Новий відгук про книгу «${BOOK.title}»`;
    const rows = [
      ["Імʼя", name],
      ["Відгук", text],
      ["Час", nowTimestamp()],
    ] as const;

    const [telegramOk, emailOk] = await Promise.all([
      runChannel("telegram", () => sendTelegram(heading, rows)),
      runChannel("email", () => sendEmail(heading, heading, rows)),
    ]);

    return NextResponse.json({
      ok: true,
      notifications: { telegram: telegramOk, email: emailOk },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
