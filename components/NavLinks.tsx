'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { pill, pillCta, pillIdle, pillOn } from '@/lib/pill';

const ARTIST_AREA = /^\/artist\/(dashboard|profile|password)(\/|$)/;

function sectionOf(pathname: string): string {
  if (pathname.startsWith('/explore')) return 'explore';
  if (pathname.startsWith('/commission')) return 'commission';
  if (pathname.startsWith('/join')) return 'join';
  if (pathname.startsWith('/artist-login') || ARTIST_AREA.test(pathname)) return 'login';
  if (pathname.startsWith('/artist/')) return 'explore';
  if (pathname.startsWith('/studio')) return 'studio';
  return '';
}

export default function NavLinks() {
  const router = useRouter();
  const current = sectionOf(usePathname() || '');
  const [isAdmin, setIsAdmin] = useState(false);

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

  async function signOut() {
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

  const joinActive = current === 'join';

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
      {item('explore', '/explore', 'Explore')}
      {item('commission', '/commission', 'Commission')}
      {item('login', '/artist-login', 'Artist Login')}
      {isAdmin && (
        <>
          <Link
            href="/studio"
            aria-current={current === 'studio' ? 'page' : undefined}
            className={`${pill} border-blue-deep bg-blue-deep text-cream hover:border-night hover:bg-night`}
          >
            Studio
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center min-h-11 px-2 text-sm text-ink-soft underline hover:text-ink"
          >
            Log out
          </button>
        </>
      )}
      <Link
        href="/join"
        aria-current={joinActive ? 'page' : undefined}
        className={`${pill} ${joinActive ? pillOn : pillCta}`}
      >
        Become an Artist
      </Link>
    </nav>
  );
}