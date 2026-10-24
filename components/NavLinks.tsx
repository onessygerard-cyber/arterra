'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const current = sectionOf(usePathname() || '');

  function textLink(key: string, href: string, label: string, small = false) {
    const active = current === key;
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`inline-flex items-center min-h-11 px-3 font-medium transition-colors ${
          small ? 'text-xs' : 'text-sm'
        } ${active ? 'text-ink' : 'text-ink-soft hover:text-brand'}`}
      >
        <span className={`border-b-2 pb-0.5 ${active ? 'border-brand' : 'border-transparent'}`}>{label}</span>
      </Link>
    );
  }

  const joinActive = current === 'join';

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-x-1">
      {textLink('explore', '/explore', 'Explore')}
      {textLink('commission', '/commission', 'Commission')}
      {textLink('login', '/artist-login', 'Artist Login')}
      {textLink('studio', '/studio', 'Studio', true)}
      <Link
        href="/join"
        aria-current={joinActive ? 'page' : undefined}
        className={`inline-flex items-center min-h-11 ml-2 px-4 rounded-full border text-sm font-medium transition-colors ${
          joinActive
            ? 'bg-brand border-brand text-cream'
            : 'border-brand text-brand hover:bg-brand hover:text-cream'
        }`}
      >
        Become an Artist
      </Link>
    </nav>
  );
}