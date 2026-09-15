import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-20 pb-24">
      <div className="max-w-xl">
        <p className="font-mono text-xs uppercase tracking-wider text-gold-deep mb-4">
          Now onboarding artists
        </p>
        <h1 className="text-4xl md:text-5xl leading-tight mb-5">
          Your vision.<br /><em className="text-blue not-italic font-display italic">Made original.</em>
        </h1>
        <p className="text-ink-soft text-lg mb-8 max-w-prose">
          ARTERRA matches you with vetted independent artists, working in painting, drawing, portraiture, and more, to create a piece made to your size, budget, and story.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/commission" className="bg-ink text-cream px-6 py-3 rounded-lg font-medium hover:bg-blue-deep">
            Start a Commission
          </Link>
          <Link href="/join" className="border border-line px-6 py-3 rounded-lg font-medium hover:bg-sand">
            I&apos;m an artist
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
        {[
          ["01", "Tell us what you want", "Share your style, size, budget, and deadline. It takes two minutes."],
          ["02", "We match you", "We pick artists suited to your brief."],
          ["03", "Agree & begin", "Confirm price and timeline, then the artist starts."],
          ["04", "Track & receive", "Follow progress here until it arrives."],
        ].map(([num, title, body]) => (
          <div key={num} className="border-t-2 border-line pt-3">
            <p className="font-mono text-xs text-gold-deep">{num}</p>
            <h3 className="font-display text-base mt-1 mb-1">{title}</h3>
            <p className="text-sm text-ink-soft">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}