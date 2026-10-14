import { BOOK, HAS_PAYMENT_URL } from "@/config/book";

/**
 * Перехід на оплату після відправки форми — спільний для замовлення
 * і подарунка бібліотеці.
 *
 * Порядок важливий:
 *  1. openPaymentTab() — синхронно, ДО будь-якого await у обробнику:
 *     інакше браузер втратить звʼязок із жестом користувача і заблокує попап;
 *  2. після успішної відповіді сервера — goToPayment();
 *  3. після помилки — closePaymentTab(), щоб не лишати порожню вкладку.
 */

/**
 * Посилання на оплату з потрібною сумою: monobank бере її з параметра `a`
 * (https://send.monobank.ua/…?a=700). Параметр перезаписується, тож у
 * NEXT_PUBLIC_PAYMENT_URL може лежати посилання з будь-якою сумою або без неї.
 */
export function paymentUrlFor(amount: number) {
  try {
    const url = new URL(BOOK.paymentUrl);
    url.searchParams.set("a", String(amount));
    return url.toString();
  } catch {
    // Не URL — віддаємо як є: краще оплата без суми, ніж зламана кнопка.
    return BOOK.paymentUrl;
  }
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);

export function openPaymentTab() {
  if (!HAS_PAYMENT_URL || isIOS()) return null;
  const tab = window.open("about:blank", "_blank");
  if (tab) {
    tab.opener = null;
  }
  return tab;
}

/**
 * onManual викликається, коли автоматично перейти не вдалося (попап
 * заблоковано) — тоді покупцю треба показати кнопку «Відкрити оплату».
 */
export function goToPayment(
  tab: Window | null,
  amount: number,
  onManual: () => void,
) {
  if (!HAS_PAYMENT_URL) return;
  const paymentUrl = paymentUrlFor(amount);

  if (isIOS()) {
    // iOS Safari блокує відкладені попапи — переходимо в тій самій вкладці.
    window.location.href = paymentUrl;
    return;
  }

  if (!tab || tab.closed) {
    onManual();
    return;
  }

  try {
    tab.location.href = paymentUrl;
    window.setTimeout(() => {
      try {
        const href = tab.location.href;
        if (href === "about:blank" || href === "about:blank#") {
          onManual();
        }
      } catch {
        // Cross-origin читання впало → навігація успішна.
      }
    }, 1000);
  } catch {
    onManual();
  }
}

export function closePaymentTab(tab: Window | null) {
  if (tab && !tab.closed) {
    tab.close();
  }
}
