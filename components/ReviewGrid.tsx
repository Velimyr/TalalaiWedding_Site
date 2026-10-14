"use client";

import { useEffect, useState } from "react";
import ReviewCard, { type Review } from "@/components/ReviewCard";
import { pickOrnaments, type OrnamentKind } from "@/components/ReviewOrnament";

/** Тасування Фішера–Єйтса: кожна перестановка рівноймовірна. */
function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Item = { review: Review; ornament: OrnamentKind | null };

/**
 * Сітка відгуків з випадковими орнаментами (1–2 на ряд).
 *
 * shuffle + count — для лендінгу: count випадкових відгуків.
 * Без них — усі відгуки по порядку (сторінка /reviews).
 *
 * Сторінки статичні, тож випадковість на сервері «застигла» б на етапі
 * збірки — і всі бачили б те саме до наступного деплою. Тому сервер віддає
 * відгуки без орнаментів, а вибірка й орнаменти розставляються вже в
 * браузері (орнаменти при цьому плавно проявляються).
 */
export default function ReviewGrid({
  reviews,
  count = reviews.length,
  shuffle: shouldShuffle = false,
}: {
  reviews: readonly Review[];
  count?: number;
  shuffle?: boolean;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    reviews.slice(0, count).map((review) => ({ review, ornament: null })),
  );

  useEffect(() => {
    const picked = (shouldShuffle ? shuffle(reviews) : [...reviews]).slice(0, count);
    const ornaments = pickOrnaments(picked.length);
    // Math.random на сервері дав би розбіжність гідратації — рахуємо тут.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(picked.map((review, index) => ({ review, ornament: ornaments[index] })));
  }, [reviews, count, shouldShuffle]);

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(({ review, ornament }) => (
        <ReviewCard key={review.quote} review={review} ornament={ornament} />
      ))}
    </div>
  );
}
