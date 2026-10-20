import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto mt-24 px-6 pb-24">
      <h1 className="text-3xl mb-3">We couldn&apos;t find that page.</h1>
      <p className="text-ink-soft mb-8 max-w-prose">
        The link may be out of date or mistyped. You can browse the artists instead.
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link href="/explore"
          className="inline-flex items-center min-h-11 bg-ink text-cream px-6 rounded-lg font-medium hover:bg-brand-deep">
          Explore Artists
        </Link>
        <Link href="/"
          className="inline-flex items-center min-h-11 border border-line px-6 rounded-lg font-medium hover:bg-sand">
          Back to home
        </Link>
      </div>
    </main>
  );
}