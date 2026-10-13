export type Review = { quote: string; author: string };

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_16px_36px_-30px_rgba(14,74,46,0.8)]">
      <p className="text-sm leading-relaxed text-muted">«{review.quote}»</p>
      {/* mt-auto — щоб імена в сусідніх картках стояли на одній лінії. */}
      <p className="mt-auto pt-5 font-display text-lg text-accent-deep">
        {review.author}
      </p>
    </article>
  );
}
