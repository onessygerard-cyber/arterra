'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="max-w-xl mx-auto mt-24 px-6 pb-24">
      <h1 className="text-3xl mb-3">Something went wrong.</h1>
      <p className="text-ink-soft mb-8 max-w-prose">
        That page didn&apos;t load. Try again, and if it keeps happening, contact the ARTERRA team.
      </p>
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => reset()}
          className="min-h-11 bg-ink text-cream px-6 rounded-lg font-medium hover:bg-brand-deep">
          Try again
        </button>
        <Link href="/"
          className="inline-flex items-center min-h-11 border border-line px-6 rounded-lg font-medium hover:bg-sand">
          Back to home
        </Link>
      </div>
    </main>
  );
}