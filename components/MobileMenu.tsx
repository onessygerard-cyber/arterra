'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { key: 'explore', href: '/explore', label: 'Explore' },
  { key: 'commission', href: '/commission', label: 'Commission' },
  { key: 'experiences', href: '/experiences', label: 'Experiences' },
  { key: 'login', href: '/artist-login', label: 'Artist Login' },
];

function delay(ms: number): CSSProperties {
  return { '--d': `${ms}ms` } as CSSProperties;
}

export default function MobileMenu({
  current,
  isAdmin,
  onSignOut,
}: {
  current: string;
  isAdmin: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  const pathname = usePathname() || '';
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const open = openFor === pathname;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenFor(null);
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const items = sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const wide = window.matchMedia('(min-width: 1024px)');
    function onWide(e: MediaQueryListEvent) {
      if (e.matches) setOpenFor(null);
    }

    document.addEventListener('keydown', onKeyDown);
    wide.addEventListener('change', onWide);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onWide);
      buttonRef.current?.focus();
    };
  }, [open]);

  const close = () => setOpenFor(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpenFor(pathname)}
        className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-brand/40 text-brand transition-colors hover:border-brand hover:bg-brand/5 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="menu-sheet fixed inset-0 z-[60] overflow-y-auto bg-night text-bone"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: "url('/hero-brushwork.jpg')" }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-night/75" />

            <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 pb-10 pt-4">
              <div className="flex items-center justify-between">
                <Image
                  src="/arterra-logo-light.png"
                  alt="ARTERRA"
                  width={800}
                  height={233}
                  className="h-10 w-auto"
                />
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  className="inline-flex min-h-11 w-11 items-center justify-center rounded-full border border-bone/40 text-bone transition-colors hover:bg-bone hover:text-night"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <nav aria-label="Menu" className="mt-12 flex flex-col">
                {LINKS.map((l, i) => (
                  <Link
                    key={l.key}
                    href={l.href}
                    onClick={close}
                    aria-current={current === l.key ? 'page' : undefined}
                    style={delay(120 + i * 70)}
                    className="menu-rise flex min-h-16 items-baseline gap-4 border-b border-bone/15 py-4"
                  >
                    <span className="font-mono text-xs text-bone/60">{`0${i + 1}`}</span>
                    <span
                      className={`font-display text-4xl leading-none ${
                        current === l.key ? 'text-gold' : 'text-bone'
                      }`}
                    >
                      {l.label}
                    </span>
                  </Link>
                ))}
              </nav>

              <Link
                href="/join"
                onClick={close}
                style={delay(120 + LINKS.length * 70)}
                className="menu-rise mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-bone px-7 font-medium text-night transition-colors hover:bg-gold"
              >
                Become an Artist
              </Link>

              <div className="menu-rise mt-auto pt-14" style={delay(160 + LINKS.length * 70)}>
                <p className="font-mono text-xs uppercase tracking-wider text-bone/60">Team</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-6">
                  {isAdmin ? (
                    <>
                      <Link href="/studio" onClick={close} className="inline-flex min-h-11 items-center text-bone underline">
                        Open Studio
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          void onSignOut();
                        }}
                        className="inline-flex min-h-11 items-center text-bone underline"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <Link href="/studio/login" onClick={close} className="inline-flex min-h-11 items-center text-bone underline">
                      Studio
                    </Link>
                  )}
                </div>
                <p className="mt-8 font-display italic text-bone/70">Your vision. Made original.</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}