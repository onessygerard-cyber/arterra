export type Review = {
  rating: number;
  body: string;
  display_name: string;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="text-gold-deep tracking-wide">
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="mt-20" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-xl mb-1">Reviews</h2>
      <p className="text-sm text-ink-soft mb-8">
        {average.toFixed(1)} out of 5 from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
      </p>
      <div className="space-y-8 max-w-prose">
        {reviews.map((r, i) => (
          <div key={i}>
            <div className="flex items-center gap-3 mb-1">
              <Stars rating={r.rating} />
              <span className="text-sm font-medium">{r.display_name}</span>
              <span className="text-xs text-ink-soft">
                {new Date(r.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long' })}
              </span>
            </div>
            {r.body && <p className="text-sm text-ink whitespace-pre-line">{r.body}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}