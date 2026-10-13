"use client";

import { useEffect, useState } from "react";
import ReviewCard, { type Review } from "@/components/ReviewCard";

/** Тасування Фішера–Єйтса: кожна перестановка рівноймовірна. */
function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Випадкові count відгуків на лендінгу.
 *
 * Сторінка статична, тож випадковість на сервері «застигла» б на етапі
 * збірки — і всі бачили б ті самі відгуки до наступного деплою. Тому сервер
 * віддає перші count, а вибірка тасується вже в браузері. Секція далеко
 * нижче першого екрана, тож підміну ніхто не помічає.
 */
export default function ReviewsPreview({
  reviews,
  count,
}: {
  reviews: readonly Review[];
  count: number;
}) {
  const [visible, setVisible] = useState(() => reviews.slice(0, count));

  useEffect(() => {
    // Math.random на сервері дав би розбіжність гідратації — тасуємо тут.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(shuffle(reviews).slice(0, count));
  }, [reviews, count]);

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {visible.map((review) => (
        <ReviewCard key={review.quote} review={review} />
      ))}
    </div>
  );
}
