'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/image-host';

export type Slide = {
  id: string;
  image: string;
  title: string;
  artist: string;
  detail: string;
  href: string;
  status?: string;
  fallback?: boolean;
};

const INTERVAL = 6500;

const ctrl =
  'inline-flex items-center justify-center min-h-11 w-11 rounded-full border border-bone/40 text-bone transition-colors hover:bg-bone hover:text-night';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function Mark({ status }: { status?: string }) {
  if (status === 'sold') {
    return (
      <span className="inline-flex items-center rounded-full bg-bone px-2.5 py-0.5 text-xs font-semibold text-night">
        Sold
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-bone/60 px-2.5 py-0.5 text-xs font-semibold text-bone">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
        Available
      </span>
    );
  }
  return null;
}

export default function ArtSlideshow({ slides }: { slides: Slide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setPlaying(false);
    const onMotion = (e: MediaQueryListEvent) => {
      if (e.matches) setPlaying(false);
    };
    const onVisibility = () => setTabHidden(document.hidden);
    mq.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mq.removeEventListener('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || !playing || paused || tabHidden) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % count), INTERVAL);
    return () => window.clearInterval(timer);
  }, [count, playing, paused, tabHidden, index]);

  function go(delta: number) {
    setIndex(i => (i + delta + count) % count);
  }

  if (count === 0) return null;
  const slide = slides[Math.min(index, count - 1)];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured artwork"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative mx-auto w-full max-w-[24rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-12 -z-10"
          style={{
            background:
              'radial-gradient(closest-side, rgba(251,205,13,0.16), rgba(251,205,13,0) 72%)',
          }}
        />

        <div className="bg-bone p-3 shadow-[0_30px_60px_-18px_rgba(0,0,0,0.75)] sm:p-4">
          <div
            className="relative aspect-[4/5] touch-pan-y overflow-hidden bg-[#E9E2D3]"
            onPointerDown={e => {
              startX.current = e.clientX;
            }}
            onPointerUp={e => {
              if (startX.current === null || count < 2) return;
              const dx = e.clientX - startX.current;
              startX.current = null;
              if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              startX.current = null;
            }}
          >
            {slides.map((s, i) => {
              const active = i === index;
              const optimized = s.image.startsWith('/') || canOptimize(s.image);
              const imgClass = s.fallback ? 'object-cover' : 'object-contain drop-shadow-md';
              const alt = s.artist ? `${s.title} by ${s.artist}` : s.title;
              return (
                <div
                  key={s.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={!active}
                  className={`absolute inset-0 motion-safe:transition-opacity motion-safe:duration-1000 motion-safe:ease-in-out ${
                    active ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                >
                  <div
                    className={`h-full w-full motion-safe:transition-transform motion-safe:duration-[7000ms] motion-safe:ease-out ${
                      s.fallback ? '' : 'p-5 sm:p-7'
                    } ${active ? 'scale-[1.03]' : 'scale-100'}`}
                  >
                    <div className="relative h-full w-full">
                      {optimized ? (
                        <Image
                          src={s.image}
                          alt={alt}
                          fill
                          sizes="(min-width: 768px) 360px, 86vw"
                          loading={i === 0 ? 'eager' : 'lazy'}
                          className={imgClass}
                        />
                      ) : (
                        <img
                          src={s.image}
                          alt={alt}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          className={`absolute inset-0 h-full w-full ${imgClass}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-7 w-full max-w-[24rem]">
        {count > 1 && (
          <p className="font-mono text-xs text-bone/70">
            {pad(index + 1)} / {pad(count)}
          </p>
        )}
        <p
          className="mt-1 font-display text-2xl leading-snug text-bone"
          aria-live={playing && !paused ? 'off' : 'polite'}
        >
          {slide.title}
        </p>
        <p className="mt-0.5 text-sm text-bone/80">
          {[slide.artist, slide.detail].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Mark status={slide.status} />
          <Link
            href={slide.href}
            className="inline-flex min-h-11 items-center text-sm text-bone underline hover:text-gold"
          >
            {slide.fallback ? 'Apply to join' : 'View piece'}
          </Link>
        </div>

        {count > 1 && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Previous artwork" onClick={() => go(-1)} className={ctrl}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button type="button" aria-label="Next artwork" onClick={() => go(1)} className={ctrl}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
              onClick={() => setPlaying(p => !p)}
              className={ctrl}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="ml-1 flex items-center">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Show artwork ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  className="inline-flex min-h-11 w-6 items-center justify-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-gold' : 'w-1.5 bg-bone/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}