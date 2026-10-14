import ReviewOrnament, { type OrnamentKind } from "@/components/ReviewOrnament";

export type Review = { quote: string; author: string };

export default function ReviewCard({
  review,
  ornament = null,
}: {
  review: Review;
  ornament?: OrnamentKind | null;
}) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-[0_16px_36px_-30px_rgba(14,74,46,0.8)]">
      {ornament ? <ReviewOrnament kind={ornament} /> : null}
      {/* relative — щоб текст лежав над орнаментом, якщо вони зійдуться. */}
      <p className="relative text-sm leading-relaxed text-muted">
        «{review.quote}»
      </p>
      {/* mt-auto — щоб імена в сусідніх картках стояли на одній лінії. */}
      <p className="relative mt-auto pt-5 font-display text-lg text-accent-deep">
        {review.author}
      </p>
    </article>
  );
}
