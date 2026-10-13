import { NextResponse } from "next/server";
import crypto from "crypto";
import { BOOK, GIFT_LIMITS } from "@/config/book";
import {
  appendSheetRow,
  cleanText,
  nowTimestamp,
  runChannel,
  sendEmail,
  sendTelegram,
} from "@/lib/notify";

export const runtime = "nodejs";

/**
 * «Подарунок бібліотеці»: людина оплачує примірники, а книги йдуть не їй,
 * а бібліотеці. Тому доставки тут немає — лише контакт платника і,
 * за бажанням, дані бібліотеки.
 */
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    // Honeypot: бот заповнив приховане поле — тихо підтверджуємо й нічого не шлемо.
    if (payload.website) {
      return NextResponse.json({ ok: true, giftId: "" });
    }

    const name = cleanText(payload.name);
    const contact = cleanText(payload.contact);
    const library = cleanText(payload.library);
    const quantity = Number(payload.quantity);

    if (!name || name.length > GIFT_LIMITS.name) {
      return NextResponse.json({ error: "Invalid field: name" }, { status: 400 });
    }
    if (!contact || contact.length > GIFT_LIMITS.contact) {
      return NextResponse.json({ error: "Invalid field: contact" }, { status: 400 });
    }
    if (library.length > GIFT_LIMITS.library) {
      return NextResponse.json({ error: "Invalid field: library" }, { status: 400 });
    }
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > GIFT_LIMITS.quantity
    ) {
      return NextResponse.json({ error: "Invalid field: quantity" }, { status: 400 });
    }

    const giftId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const libraryText = library || "Не вказано — обрати самостійно";
    const heading = `🎁 Подарунок бібліотеці «${BOOK.title}» #${giftId}`;
    const rows = [
      ["Примірників", String(quantity)],
      ["Платник", name],
      ["Контакт", contact],
      ["Бібліотека", libraryText],
      ["Час", nowTimestamp()],
    ] as const;

    const [sheetOk, telegramOk, emailOk] = await Promise.all([
      // Окремий аркуш: колонки в нього інші, ніж у звичайних замовлень.
      runChannel("google-sheets", () =>
        appendSheetRow(process.env.GOOGLE_SHEETS_GIFTS_SHEET_NAME ?? "Gifts", [
          nowTimestamp(),
          giftId,
          String(quantity),
          name,
          contact,
          libraryText,
        ]),
      ),
      runChannel("telegram", () => sendTelegram(heading, rows)),
      runChannel("email", () => sendEmail(heading, heading, rows)),
    ]);

    return NextResponse.json({
      ok: true,
      giftId,
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
