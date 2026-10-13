import { google } from "googleapis";
import { escapeHtml } from "@/lib/escape";

/**
 * Канали сповіщень, спільні для всіх API-роутів (замовлення, подарунок,
 * питання, відгук).
 *
 * Канали навмисно не валять запит: якщо змінних оточення немає або сервіс
 * відмовив, функція повертає false, а заявка однаково приймається. Але мовчати
 * вони теж не мають: без логів «не налаштовано», «API відмовив» і «мережа
 * впала» виглядають однаково. Токени в лог не потрапляють: пишемо лише статус
 * і тіло відповіді.
 */

/** Рядок повідомлення: підпис і значення. */
export type NotifyRow = readonly [label: string, value: string];

const getEnv = (key: string) => process.env[key];

export const nowTimestamp = () =>
  new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kiev" });

export const runChannel = (name: string, run: () => Promise<boolean>) =>
  run().catch((error) => {
    console.error(`[${name}] канал впав:`, error);
    return false;
  });

export async function sendTelegram(heading: string, rows: readonly NotifyRow[]) {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getEnv("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    console.warn(
      "[telegram] пропущено: не задані TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID",
    );
    return false;
  }

  // Без parse_mode — тоді екранування розмітки не потрібне.
  const text = [heading, ...rows.map(([label, value]) => `${label}: ${value}`)].join(
    "\n",
  );

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

export async function sendEmail(
  subject: string,
  heading: string,
  rows: readonly NotifyRow[],
) {
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
    <h2>${escapeHtml(heading)}</h2>
    <ul>
      ${rows
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
    body: JSON.stringify({ from, to, subject, html }),
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

/** Дописує рядок у вказаний аркуш таблиці (аркуш має вже існувати). */
export async function appendSheetRow(sheetName: string, row: readonly string[]) {
  const sheetId = getEnv("GOOGLE_SHEETS_SHEET_ID");
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

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[...row]] },
  });

  return true;
}

/** Рядок, обрізаний по краях; не-рядки (зокрема відсутнє поле) дають "". */
export const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
