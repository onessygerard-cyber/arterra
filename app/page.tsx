import Link from "next/link";
import FeaturedRow from "@/components/FeaturedRow";
import HeroBackdrop from "@/components/HeroBackdrop";

export const revalidate = 300;

const steps = [
  ["01", "Tell us what you want", "Share your style, size, budget, and deadline. It takes two minutes."],
  ["02", "We match you", "We pick artists suited to your brief."],
  ["03", "Agree & begin", "Confirm price and timeline, then the artist starts."],
  ["04", "Track & receive", "Follow progress here until it arrives."],
];

export default function HomePage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-night text-cream">
        <HeroBackdrop />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-40">
          <p className="font-mono text-xs uppercase tracking-wider text-gold mb-6">
            Now onboarding artists
          </p>
          <h1 className="text-5xl md:text-7xl leading-[1.02] mb-6 max-w-2xl">
            Your vision.
            <br />
            <em className="font-display italic text-gold">Made original.</em>
          </h1>
          <p className="text-lg text-cream/85 mb-10 max-w-xl">
            ARTERRA matches you with vetted independent artists, working in painting, drawing, portraiture, and more, to create a piece made to your size, budget, and story.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/commission"
              className="inline-flex items-center min-h-12 bg-brand text-cream px-7 rounded-lg font-medium hover:bg-brand-deep"
            >
              Commission a Piece
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center min-h-12 border border-cream/60 text-cream px-7 rounded-lg font-medium hover:bg-cream hover:text-ink"
            >
              Register as an Artist
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl mb-10">How it works</h2>
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map(([num, title, body]) => (
            <li key={num} className="border-t-2 border-ink pt-4">
              <span className="font-display text-4xl text-brand block mb-2">{num}</span>
              <h3 className="text-lg mb-1">{title}</h3>
              <p className="text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <FeaturedRow />

      <section className="relative isolate overflow-hidden bg-night text-cream">
        <HeroBackdrop skip={1} take={3} flip />
        <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-24">
          <h2 className="text-3xl md:text-4xl mb-4 max-w-xl">Are you an artist?</h2>
          <p className="text-cream/85 mb-8 max-w-xl">
            Apply to show your work on ARTERRA. Every application is reviewed by hand.
          </p>
          <Link
            href="/join"
            className="inline-flex items-center min-h-12 bg-cream text-ink px-7 rounded-lg font-medium hover:bg-gold"
          >
            Become an Artist
          </Link>
        </div>
      </section>
    </main>
  );
}