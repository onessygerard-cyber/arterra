'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { pill, pillCta, pillIdle, pillOn } from '@/lib/pill';

const ARTIST_AREA = /^\/artist\/(dashboard|profile|password|experiences)(\/|$)/;

function sectionOf(pathname: string): string {
  if (pathname.startsWith('/explore')) return 'explore';
  if (pathname.startsWith('/commission')) return 'commission';
  if (pathname.startsWith('/experiences')) return 'experiences';
  if (pathname.startsWith('/join')) return 'join';
  if (pathname.startsWith('/artist-login') || ARTIST_AREA.test(pathname)) return 'login';
  if (pathname.startsWith('/artist/')) return 'explore';
  if (pathname.startsWith('/studio')) return 'studio';
  return '';
}

const menuItem =
  'flex w-full items-center min-h-11 px-3 rounded-lg text-sm text-left text-ink hover:bg-sand';

export default function NavLinks() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const current = sectionOf(pathname);

  const [isAdmin, setIsAdmin] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [alignRight, setAlignRight] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const menuOpen = openFor === pathname;

  useEffect(() => {
    let cancelled = false;

    async function check(token?: string) {
      if (!token) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      try {
        const res = await fetch('/api/is-admin', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setIsAdmin(res.ok && data.admin === true);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    supabaseBrowser.auth.getSession().then(({ data }) => check(data.session?.access_token));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      check(session?.access_token);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenFor(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenFor(null);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  function toggleMenu() {
    if (menuOpen) {
      setOpenFor(null);
      return;
    }
    const box = menuRef.current?.getBoundingClientRect();
    setAlignRight(!box || box.right >= 200);
    setOpenFor(pathname);
  }

  async function signOut() {
    setOpenFor(null);
    await supabaseBrowser.auth.signOut();
    router.push('/');
  }

  function item(key: string, href: string, label: string) {
    const active = current === key;
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`${pill} ${active ? pillOn : pillIdle}`}
      >
        {label}
      </Link>
    );
  }

  const studioActive = current === 'studio';
  const joinActive = current === 'join';

  const iconTone = studioActive
    ? 'border-brand bg-brand text-cream hover:bg-brand-deep'
    : isAdmin
      ? 'border-blue-deep bg-blue-deep text-cream hover:bg-night'
      : pillIdle;

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
      {item('explore', '/explore', 'Explore')}
      {item('commission', '/commission', 'Commission')}
      {item('experiences', '/experiences', 'Experiences')}
      {item('login', '/artist-login', 'Artist Login')}

      <Link
        href="/join"
        aria-current={joinActive ? 'page' : undefined}
        className={`${pill} ${joinActive ? pillOn : pillCta}`}
      >
        Become an Artist
      </Link>

      <div
        ref={menuRef}
        className="relative"
        onBlur={e => {
          const next = e.relatedTarget as Node | null;
          if (next && !e.currentTarget.contains(next)) setOpenFor(null);
        }}
      >
        <button
          ref={toggleRef}
          type="button"
          aria-label={isAdmin ? 'Team menu, signed in' : 'Team menu'}
          aria-expanded={menuOpen}
          aria-controls="team-menu"
          onClick={toggleMenu}
          className={`inline-flex items-center justify-center min-h-11 w-11 rounded-full border transition-colors ${iconTone}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div
            id="team-menu"
            className={`absolute top-full z-50 mt-2 w-48 rounded-xl border border-line bg-card p-1 shadow-lg ${
              alignRight ? 'right-0' : 'left-0'
            }`}
          >
            {isAdmin ? (
              <>
                <p className="px-3 pt-2 pb-1 text-xs text-ink-soft">Signed in as team</p>
                <Link href="/studio" onClick={() => setOpenFor(null)} className={menuItem}>
                  Open Studio
                </Link>
                <button type="button" onClick={signOut} className={menuItem}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <p className="px-3 pt-2 pb-1 text-xs text-ink-soft">For the ARTERRA team</p>
                <Link href="/studio/login" onClick={() => setOpenFor(null)} className={menuItem}>
                  Studio
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}