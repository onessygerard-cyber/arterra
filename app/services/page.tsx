import type { Metadata } from 'next';
import Link from 'next/link';
import HeroBackdrop from '@/components/HeroBackdrop';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Our Programs and Services',
  description:
    'Original artwork, custom commissions, art experiences and tools for artists, all in one place.',
};

type Service = { num: string; title: string; body: string; href: string; cta: string };

const forBuyers: Service[] = [
  {
    num: '01',
    title: 'Original artwork',
    body: 'Browse original pieces and prints from artists we have reviewed. Every piece shows whether it is still available. Save your favourites, and ask the artist about any piece.',
    href: '/explore',
    cta: 'Explore art',
  },
  {
    num: '02',
    title: 'Custom commissions',
    body: 'Describe what you are picturing in a short guided form. We read it, match you with an artist by hand, and agree a price and timeline with you.',
    href: '/commission',
    cta: 'Start a commission',
  },
  {
    num: '03',
    title: 'Art experiences',
    body: 'Workshops and live sessions hosted by our artists. Reserve a place, and we confirm it by hand.',
    href: '/experiences',
    cta: 'See experiences',
  },
  {
    num: '04',
    title: 'Private events',
    body: 'Want a workshop for your team, a celebration or a group? Tell us what you have in mind and we will plan it with an artist.',
    href: '/experiences/private',
    cta: 'Plan a private event',
  },
];

const included = [
  'A real person reads your request and chooses the artist',
  'A private tracking page that only you can open',
  'Progress photos at each stage, which you can approve',
  'One round of changes at the concept, sketch and colours stages',
  'Your approval of the final piece before the work is complete',
  'A review you can leave once your piece is delivered',
];

const forArtists: Service[] = [
  {
    num: '01',
    title: 'A profile that is yours',
    body: 'Your photo, your bio, your prices and your portfolio, on a public page you can share with anyone.',
    href: '/join',
    cta: 'Apply to join',
  },
  {
    num: '02',
    title: 'Sell originals and prints',
    body: 'List pieces with photos and prices, or choose price on request. Mark a piece sold when it goes, and it stays on your page.',
    href: '/join',
    cta: 'Apply to join',
  },
  {
    num: '03',
    title: 'Take commissions',
    body: 'We bring you matched requests. Quote them, message the buyer, and share progress photos for approval as you work.',
    href: '/join',
    cta: 'Apply to join',
  },
  {
    num: '04',
    title: 'Host experiences',
    body: 'Propose a workshop or live session. We review it, publish it and manage the reservations for you.',
    href: '/join',
    cta: 'Apply to join',
  },
];

function ServiceGrid({ items }: { items: Service[] }) {
  return (
    <ol className="grid gap-10 sm:grid-cols-2">
      {items.map(s => (
        <li key={s.num} className="border-t-2 border-ink pt-4">
          <span className="mb-2 block font-display text-4xl text-brand">{s.num}</span>
          <h3 className="mb-2 text-xl">{s.title}</h3>
          <p className="mb-3 text-sm text-ink-soft">{s.body}</p>
          <Link href={s.href} className="inline-flex min-h-11 items-center text-sm text-blue-deep underline">
            {s.cta}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function ServicesPage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden bg-night text-bone">
        <HeroBackdrop take={0} />
        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <p className="mb-6 font-mono text-xs uppercase tracking-wider text-gold">Programs and services</p>
          <h1 className="mb-6 max-w-2xl text-5xl leading-[1.04] md:text-6xl">
            Our programs{' '}
            <span className="relative inline-block">
              <em className="font-display italic text-gold">and services.</em>
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
            Whether you are looking for a piece, hoping to have one made, or making art yourself, here is how we can help.
          </p>
        </div>
      </section>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 py-20" aria-labelledby="buyers-title">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-soft">For art lovers and buyers</p>
        <h2 id="buyers-title" className="mb-10 text-3xl">Find it, or have it made</h2>
        <ServiceGrid items={forBuyers} />
      </Reveal>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-20" aria-labelledby="included-title">
        <div className="rounded-2xl border border-line bg-card p-7 shadow-sm sm:p-10">
          <h2 id="included-title" className="mb-1 text-2xl">Included with every commission</h2>
          <p className="mb-6 text-sm text-ink-soft">Nothing to add on. This is how every commission works.</p>
          <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {included.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-brand"
                >
                  <path d="m5 12 5 5 9-10" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-20" aria-labelledby="artists-title">
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-soft">For artists</p>
        <h2 id="artists-title" className="mb-10 text-3xl">Show your work, and be found</h2>
        <ServiceGrid items={forArtists} />
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/join"
            className="inline-flex min-h-12 items-center rounded-lg bg-brand px-7 font-medium text-cream hover:bg-brand-deep"
          >
            Apply to join
          </Link>
          <Link href="/artist-login" className="inline-flex min-h-11 items-center text-sm text-blue-deep underline">
            Artist login
          </Link>
        </div>
      </Reveal>

      <Reveal as="section" className="mx-auto max-w-4xl px-6 pb-24" aria-labelledby="payment-title">
        <div className="border-l-4 border-gold pl-5">
          <h2 id="payment-title" className="mb-1 text-lg">How payment works today</h2>
          <p className="max-w-prose text-sm text-ink-soft">
            We do not take payments on the site yet. We confirm the price and timeline with you, then arrange payment directly. We will update this page when that changes.
          </p>
        </div>
      </Reveal>

      <section className="relative isolate overflow-hidden bg-night text-bone">
        <HeroBackdrop skip={1} take={3} flip />
        <div className="relative mx-auto max-w-4xl px-6 py-20 md:py-24">
          <h2 className="mb-6 max-w-xl text-3xl md:text-4xl">Not sure where to start?</h2>
          <p className="mb-8 max-w-xl text-bone/85">
            Have a look around the gallery, or tell us what you are picturing and we will take it from there.
          </p>
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
              Start a commission
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}