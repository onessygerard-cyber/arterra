import Link from 'next/link';

export default function MyCommissionsRetiredPage() {
  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-2">Looking for your commission?</h1>
      <p className="text-ink-soft mb-6">
        We now use private links instead of email lookups, so only you can see your request.
      </p>

      <div className="space-y-4">
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <p className="font-medium mb-1">Buyers</p>
          <p className="text-sm text-ink-soft">
            Open the tracking link you were shown when you submitted your request. Can&apos;t find it?
            Get in touch with the ARTERRA team and we&apos;ll resend it.
          </p>
        </div>

        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <p className="font-medium mb-1">Artists</p>
          <p className="text-sm text-ink-soft mb-3">
            Your commissions and messages are on your dashboard.
          </p>
          <Link href="/artist-login"
            className="inline-block bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
            Artist Login
          </Link>
        </div>
      </div>
    </main>
  );
}