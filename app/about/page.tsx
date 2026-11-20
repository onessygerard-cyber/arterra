import type { Metadata } from 'next';
import Link from 'next/link';
import HeroBackdrop from '@/components/HeroBackdrop';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'About',
  description:
    'ARTERRA is a small marketplace for original art. Browse pieces from independent artists, or have one made for you.',
};

const offers = [
  ['01', 'Find original work', 'Browse pieces from artists we have reviewed. Save the ones you love and ask about them.'],
  ['02', 'Commission a piece', 'Tell us what you are picturing. We match your request with the artist who fits, and you follow the work privately, approving photos along the way.'],
  ['03', 'Join an experience', 'Workshops and live sessions hosted by our artists. Reserve a place and we confirm it by hand.'],
];

const principles = [
  ['Reviewed by people', 'Every artist application is read by someone on our team before an artist appears on the site.'],
  ['Matched by hand', 'There is no algorithm. We read each request and choose the artists who suit it.'],
  ['Artists keep their work', 'Artists keep the copyright in what they make. Buying a piece gets you the piece.'],
  ['Private by default', 'Your contact details are seen only by our team. Reference images and progress photos are shown only to you, your artist and us.'],
];

export default function AboutPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const whatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, '');

  return (
    <main>
      <section className="relative isolate overflow-hidden bg-night text-bone">
        <HeroBackdrop take={0} />
        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <p className="mb-6 font-mono text-xs uppercase tracking-wider text-gold">About ARTERRA</p>
          <h1 className="mb-6 max-w-2xl text-5xl leading-[1.04] md:text-6xl">
            Art you can{' '}
            <span className="relative inline-block">
              <em className="font-display italic text-gold">ask for.</em>
              <svg
                aria-hidden="true"
                viewBox="0 0 300 14"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full"
                fill="none"
              >
                <path d="M3 9 C 50 2, 100 13, 160 6 S 250 10, 297 4" stroke="#FBCD0D" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-bone/85">
            ARTERRA is a small marketplace for original art. Browse finished pieces from independent artists, or
            describe what you are picturing and have one made for you.
          </p>
        </div>
      </section>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 py-20" aria-labelledby="offer-title">
        <h2 id="offer-title" className="mb-10 text-2xl">What you can do here</h2>
        <ol className="grid gap-10 md:grid-cols-3">
          {offers.map(([num, title, body]) => (
            <li key={num} className="border-t-2 border-ink pt-4">
              <span className="mb-2 block font-display text-4xl text-brand">{num}</span>
              <h3 className="mb-2 text-lg">{title}</h3>
              <p className="text-sm text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-20" aria-labelledby="work-title">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 id="work-title" className="text-2xl">How we work</h2>
            <p className="mt-3 text-sm text-ink-soft">
              Commissioning art should not mean searching, guessing and hoping. We do the searching and matching, and keep it all in one place.
            </p>
          </div>
          <dl className="space-y-8 md:col-span-8">
            {principles.map(([title, body]) => (
              <div key={title} className="border-b border-line pb-8 last:border-0">
                <dt className="font-display text-xl">{title}</dt>
                <dd className="mt-2 max-w-prose text-ink-soft">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-24" aria-labelledby="where-title">
        <h2 id="where-title" className="mb-3 text-2xl">Where we are</h2>
        <p className="max-w-prose text-ink-soft">
          ARTERRA is based in Rwanda. We are new, and we are onboarding artists now, so the gallery grows one artist at a time.
        </p>
        {(email || whatsapp) && (
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-ink-soft">Questions? Say hello.</span>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} className="inline-flex min-h-11 items-center text-blue-deep underline">
                WhatsApp
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center text-blue-deep underline">
                Email
              </a>
            )}
          </p>
        )}
      </Reveal>

      <section className="relative isolate overflow-hidden bg-night text-bone">
        <HeroBackdrop skip={1} take={3} flip />
        <div className="relative mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="mb-6 max-w-xl text-3xl md:text-4xl">Start with a look around.</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex min-h-12 items-center rounded-lg bg-brand px-7 font-medium text-cream hover:bg-brand-deep"
            >
              Explore art
            </Link>
            <Link
              href="/commission"
              className="inline-flex min-h-12 items-center rounded-lg border border-bone/60 px-7 font-medium text-bone hover:bg-bone hover:text-night"
            >
              Commission a piece
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-12 items-center rounded-lg border border-bone/60 px-7 font-medium text-bone hover:bg-bone hover:text-night"
            >
              Join as an artist
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}