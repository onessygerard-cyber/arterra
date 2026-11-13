'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AvailabilityMark from '@/components/AvailabilityMark';
import { canOptimize } from '@/lib/image-host';
import { SAVED_EVENT, readSaved, writeSaved } from '@/lib/saved';

type Piece = {
  id: string;
  title: string;
  artist: string;
  artist_id: string;
  price: string;
  status: string;
  image_url: string | null;
};

const MAX_LISTED = 24;

export default function SavedMenu() {
  const pathname = usePathname() || '';
  const [ids, setIds] = useState<string[]>([]);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [place, setPlace] = useState({ left: 0, width: 352 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = openFor === pathname;
  const count = ids.length;
  const idsKey = ids.join(',');

  useEffect(() => {
    const sync = () => setIds(readSaved());
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (ids.length === 0) {
      setPieces([]);
      return;
    }

    let cancelled = false;
    const requested = ids.slice(-MAX_LISTED);
    setLoading(true);
    setError('');

    fetch('/api/saved-pieces?ids=' + encodeURIComponent(requested.join(',')))
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then(data => {
        if (cancelled) return;
        const list: Piece[] = data.pieces || [];
        setPieces(list);
        const found = new Set(list.map(p => p.id));
        const missing = requested.filter(id => !found.has(id));
        if (missing.length > 0) writeSaved(ids.filter(id => !missing.includes(id)));
      })
      .catch(() => {
        if (!cancelled) setError('Your saved pieces could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idsKey]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenFor(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenFor(null);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle() {
    if (open) {
      setOpenFor(null);
      return;
    }
    const box = wrapRef.current?.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(352, vw - 32);
    if (box) {
      const desired = Math.min(Math.max(box.right - width, 16), vw - width - 16);
      setPlace({ left: desired - box.left, width });
    } else {
      setPlace({ left: 0, width });
    }
    setOpenFor(pathname);
  }

  function remove(id: string) {
    writeSaved(ids.filter(x => x !== id));
    setPieces(prev => (prev ? prev.filter(p => p.id !== id) : prev));
  }

  const order = new Map(ids.map((id, i) => [id, i]));
  const listed = (pieces || [])
    .slice()
    .sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0));

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={e => {
        const next = e.relatedTarget as Node | null;
        if (next && !e.currentTarget.contains(next)) setOpenFor(null);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={count > 0 ? `Saved pieces, ${count}` : 'Saved pieces'}
        aria-expanded={open}
        aria-controls="saved-panel"
        onClick={toggle}
        className={`relative inline-flex min-h-11 w-11 items-center justify-center rounded-full border transition-colors ${
          open
            ? 'border-brand bg-brand/10 text-brand'
            : 'border-brand/40 text-brand hover:border-brand hover:bg-brand/5'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={count > 0 ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-none text-cream"
          >
            <span key={count} className="badge-bump inline-block">{count > 99 ? '99+' : count}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          id="saved-panel"
          role="region"
          aria-label="Saved pieces"
          style={{ left: place.left, width: place.width }}
          className="absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-card shadow-xl"
        >
          <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
            <p className="font-display text-lg">Saved pieces</p>
            <p className="font-mono text-xs text-ink-soft">{count}</p>
          </div>

          {count === 0 ? (
            <div className="px-5 pb-6 pt-2 text-center">
              <p className="font-display text-lg">Nothing saved yet</p>
              <p className="mt-1 text-sm text-ink-soft">Tap the heart on any piece to keep it here.</p>
              <Link
                href="/explore"
                onClick={() => setOpenFor(null)}
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-brand px-5 text-sm font-semibold text-brand transition-colors hover:bg-brand hover:text-cream"
              >
                Explore art
              </Link>
            </div>
          ) : (
            <>
              {error ? (
                <p className="px-5 pb-4 text-sm text-red-600">{error}</p>
              ) : loading && pieces === null ? (
                <div className="space-y-3 px-5 pb-4" aria-busy="true">
                  {[0, 1].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-md bg-sand motion-safe:animate-pulse" />
                      <div className="h-4 flex-1 rounded bg-sand motion-safe:animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-line overflow-y-auto px-5">
                  {listed.map(p => (
                    <li key={p.id} className="flex items-center gap-2 py-3">
                      <Link
                        href={`/artist/${p.artist_id}?piece=${p.id}`}
                        onClick={() => setOpenFor(null)}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-sand">
                          {p.image_url &&
                            (canOptimize(p.image_url) ? (
                              <Image src={p.image_url} alt="" fill sizes="56px" className="object-cover" />
                            ) : (
                              <img src={p.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            ))}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-display text-base leading-snug">{p.title}</span>
                          <span className="block truncate text-xs text-ink-soft">
                            {p.artist} · {p.price}
                          </span>
                          <AvailabilityMark status={p.status} className="mt-1" />
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        aria-label={`Remove ${p.title} from saved`}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-line p-4">
                <Link
                  href="/explore?saved=1"
                  onClick={() => setOpenFor(null)}
                  className="flex min-h-11 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-cream transition-colors hover:bg-brand-deep"
                >
                  View all saved
                </Link>
                <p className="mt-2 text-center text-xs text-ink-soft">
                  Saved on this device only. Nothing is reserved.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}