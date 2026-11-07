import Link from "next/link";
import FeaturedRow from "@/components/FeaturedRow";
import HeroBackdrop from "@/components/HeroBackdrop";
import HomeSlideshow from "@/components/HomeSlideshow";
import MeetArtists from "@/components/MeetArtists";

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
      <HomeSlideshow>
        <p className="mb-6 font-mono text-xs uppercase tracking-wider text-gold">
          Now onboarding artists
        </p>
        <h1 className="mb-6 text-5xl leading-[1.04] md:text-6xl">
          Your vision.
          <br />
          <span className="relative inline-block">
            <em className="font-display italic text-gold">Made original.</em>
            <svg
              aria-hidden="true"
              viewBox="0 0 300 14"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-3 w-full"
              fill="none"
            >
              <path
                d="M3 9 C 50 2, 100 13, 160 6 S 250 10, 297 4"
                stroke="#FBCD0D"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <p className="mb-10 mt-8 max-w-md text-lg text-bone/85">
          ARTERRA matches you with vetted independent artists, working in painting, drawing, portraiture, and more, to create a piece made to your size, budget, and story.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/commission"
            className="inline-flex min-h-12 items-center rounded-lg bg-brand px-7 font-medium text-cream hover:bg-brand-deep"
          >
            Commission a Piece
          </Link>
          <Link
            href="/join"
            className="inline-flex min-h-12 items-center rounded-lg border border-bone/60 px-7 font-medium text-bone hover:bg-bone hover:text-night"
          >
            Register as an Artist
          </Link>
        </div>
      </HomeSlideshow>

      <MeetArtists />

      <FeaturedRow />

      <section className="mx-auto max-w-4xl px-6 pb-24" aria-labelledby="how-title">
        <h2 id="how-title" className="mb-10 text-2xl">How it works</h2>
        <ol className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {steps.map(([num, title, body]) => (
            <li key={num} className="border-t-2 border-ink pt-4">
              <span className="mb-2 block font-display text-4xl text-brand">{num}</span>
              <h3 className="mb-1 text-lg">{title}</h3>
              <p className="text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative isolate overflow-hidden bg-night text-bone">
        <HeroBackdrop skip={1} take={3} flip />
        <div className="relative mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="mb-4 max-w-xl text-3xl md:text-4xl">Are you an artist?</h2>
          <p className="mb-8 max-w-xl text-bone/85">
            Apply to show your work on ARTERRA. Every application is reviewed by hand.
          </p>
          <Link
            href="/join"
            className="inline-flex min-h-12 items-center rounded-lg bg-bone px-7 font-medium text-night hover:bg-gold"
          >
            Become an Artist
          </Link>
        </div>
      </section>
    </main>
  );
}