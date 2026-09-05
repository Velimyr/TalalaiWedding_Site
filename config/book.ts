/**
 * ЄДИНЕ ДЖЕРЕЛО ПРАВДИ для контенту сайту.
 * Імпортується і клієнтськими компонентами, і серверними API-роутами.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠️  ЩО ТРЕБА ЗАПОВНИТИ ПЕРЕД ЗАПУСКОМ (позначено TODO нижче):
 *   1. author, tagline, shortDescription, aboutParagraphs — реальні тексти;
 *   2. VARIANTS — перевірити підпис і ціну;
 *   3. NEXT_PUBLIC_PAYMENT_URL — робоче посилання на оплату; поки порожнє,
 *      покупець з онлайн-оплатою після замовлення нікуди не перекидається;
 *   4. NEXT_PUBLIC_SITE_URL — продакшн-домен (для canonical/OG);
 *   5. CONTENT_BLOCK.links — інші посилання автора, якщо потрібні;
 *   6. REVIEWS — реальні відгуки (порожній масив ховає секцію);
 *   7. public/cover.png — реальна обкладинка замість плейсхолдера.
 * ─────────────────────────────────────────────────────────────────────────
 */

export const BOOK = {
  title: "Талалаївське весілля",
  // TODO: ім'я автора
  author: "",
  // TODO: жанр / надрядок у hero
  tagline: "Етнографічна розвідка",
  // TODO: 1–2 речення для hero і SEO-опису
  shortDescription:
    "Книга про весільний обряд Талалаївщини: від сватання до перезви — з піснями, звичаями та живими свідченнями.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  coverSrc: "/cover.png",
  // Реальні пікселі файлу. Міняєте обкладинку — оновіть і ці два числа,
  // інакше next/image рахуватиме пропорцію за старими й обріже картинку.
  coverWidth: 498,
  coverHeight: 752,
  coverAlt: "Обкладинка книги «Талалаївське весілля»",
  // Фото листка (вирізане з leaf.png) для декоративної лінії в hero
  leafPhotoSrc: "/leaf-cutout.png",
  paymentUrl: process.env.NEXT_PUBLIC_PAYMENT_URL ?? "",
  deliveryService: "Нова пошта",
  // Підпис поля у формі (родовий відмінок)
  deliveryOfficeLabel: "Відділення Нової пошти",
} as const;

/** Абзаци секції «Про книгу». TODO: замінити на реальний текст. */
export const ABOUT = {
  heading: "Обряд, який тримає рід",
  paragraphs: [
    "TODO: абзац 1 — про що книга і як вона з'явилася.",
    "TODO: абзац 2 — джерела: свідчення, записи, архіви.",
    "TODO: абзац 3 — структура книги, що всередині.",
    "TODO: абзац 4 — кому вона буде цікава.",
  ],
} as const;

export const VARIANTS = [
  { id: "book", label: "Книга", price: 700 },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

export const VARIANT_IDS = VARIANTS.map((variant) => variant.id) as readonly string[];

export const variantById = (id: string) =>
  VARIANTS.find((variant) => variant.id === id);

export const variantOptionLabel = (variant: (typeof VARIANTS)[number]) =>
  `${variant.label} — ${variant.price} грн`;

// Перший у списку — той, що обраний у формі за замовчуванням.
export const PAYMENT_METHODS = [
  { id: "online", label: "Оплата онлайн" },
  { id: "cod", label: "Післяплата" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

/**
 * Поки посилання на оплату не задане, онлайн-оплата лишається у формі,
 * але покупця нікуди не перекидає — щоб не було мертвої кнопки.
 */
export const HAS_PAYMENT_URL = BOOK.paymentUrl.length > 0;

export const paymentLabelById = (id: string) =>
  PAYMENT_METHODS.find((method) => method.id === id)?.label;

export const IS_PREORDER =
  process.env.NEXT_PUBLIC_PREORDER_ENABLED?.toLowerCase() === "true";

export const PREORDER_TEXT =
  "Наразі книга доступна у форматі передзамовлення. Щойно наклад надійде з друкарні, ми надішлемо ваш примірник. Враховуйте це при замовленні.";

/**
 * Секція «Посилання» — два блоки.
 * Порожні href не рендеряться: «мертвих» кнопок на сайті бути не повинно.
 */
export const QUESTION_BLOCK = {
  heading: "Задати питання щодо замовлення",
  text: "Якщо щось незрозуміло з оформленням, оплатою чи доставкою — напишіть, відповімо якнайшвидше.",
} as const;

export const CONTENT_BLOCK = {
  heading: "Більше краєзнавчого контенту",
  text: "Краєзнавство, архівні пошуки та генеалогія — на каналі автора.",
  links: [
    {
      label: "«Записки диванного архівіста» — Telegram",
      href: "https://t.me/archivist_notes",
    },
  ].filter((link) => link.href.length > 0),
} as const;

/** TODO: реальні відгуки. Порожній масив ховає секцію «Відгуки». */
export const REVIEWS: ReadonlyArray<{ quote: string; author: string }> = [];

/** TODO: посилання «Читати більше відгуків». Порожнє — кнопки немає. */
export const REVIEWS_LINK = "";
