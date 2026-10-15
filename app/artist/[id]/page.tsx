'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import FadeImage from '@/components/FadeImage';

type Artist = {
  id: string; name: string; location: string; bio: string; price_range: string;
  turnaround: string; mediums: string[]; styles: string[]; ships_to: string;
};
type Artwork = {
  id: string; title: string; description: string; listing_type: string; medium: string;
  size: string; price: string; image_url: string; status: string; year: string;
  framed_status: string; style: string;
};
type Filter = 'all' | 'original' | 'print';

const tabClass = (active: boolean) =>
  `min-h-11 px-1 text-sm font-medium border-b-2 -mb-px transition-colors ${
    active ? 'border-blue-deep text-ink' : 'border-transparent text-ink-soft hover:text-ink'
  }`;

function framedLabel(s: string) {
  if (s === 'framed') return 'Framed, ready to hang';
  if (s === 'stretched') return 'Stretched canvas';
  if (s === 'unframed') return 'Unframed';
  return '';
}

function typeLabel(t: string) {
  return t === 'original' ? 'Original' : 'Print';
}

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [detail, setDetail] = useState<Artwork | null>(null);
  const [inquiryFor, setInquiryFor] = useState<Artwork | null>(null);
  const [inquiryForm, setInquiryForm] = useState({ buyerName: '', buyerContact: '', message: '' });
  const [inquirySent, setInquirySent] = useState(false);
  const [inquirySending, setInquirySending] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [copied, setCopied] = useState<'' | 'profile' | 'piece'>('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/artist-profile?id=' + id);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setArtist(data.artist);
      setArtworks(data.artworks);
      const pieceId = new URLSearchParams(window.location.search).get('piece');
      const match = (data.artworks as Artwork[]).find(x => x.id === pieceId);
      if (match) setDetail(match);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!detail && !inquiryFor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (inquiryFor) setInquiryFor(null);
      else setDetail(null);
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [detail, inquiryFor]);

  function openInquiry(a: Artwork) {
    setDetail(null);
    setInquiryFor(a);
    setInquirySent(false);
    setInquiryError('');
  }

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryFor) return;
    setInquirySending(true);
    setInquiryError('');
    try {
      const res = await fetch('/api/artwork-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: inquiryFor.id, ...inquiryForm })
      });
      if (res.ok) setInquirySent(true);
      else setInquiryError('Something went wrong. Please try again.');
    } catch {
      setInquiryError('We could not send that. Check your connection and try again.');
    }
    setInquirySending(false);
  }

  function copy(text: string, which: 'profile' | 'piece') {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(''), 2000);
  }

  const filtered = artworks.filter(a => filter === 'all' || a.listing_type === filter);
  const inputClass = "w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto mt-16 px-6 pb-20" aria-busy="true">
        <div className="h-9 w-64 bg-sand rounded motion-safe:animate-pulse mb-3" />
        <div className="h-4 w-32 bg-sand rounded motion-safe:animate-pulse mb-6" />
        <div className="h-4 w-full max-w-prose bg-sand rounded motion-safe:animate-pulse mb-2" />
        <div className="h-4 w-2/3 max-w-prose bg-sand rounded motion-safe:animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-square bg-sand rounded motion-safe:animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (notFound || !artist) {
    return (
      <main className="max-w-4xl mx-auto mt-16 px-6">
        <p className="text-ink-soft mb-4">We couldn&apos;t find that artist.</p>
        <Link href="/explore"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Back to Explore
        </Link>
      </main>
    );
  }

  const specs: [string, string][] = detail
    ? ([
        ['Medium', detail.medium],
        ['Style', detail.style],
        ['Size', detail.size],
        ['Framing', framedLabel(detail.framed_status)],
        ['Year', detail.year],
      ] as [string, string][]).filter(([, v]) => v)
    : [];

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h1 className="text-3xl mb-1">{artist.name}</h1>
          <p className="text-ink-soft">{artist.location}</p>
        </div>
        <button onClick={() => copy(window.location.origin + '/artist/' + id, 'profile')}
          className="min-h-11 text-sm font-medium border border-line bg-card px-4 rounded-full hover:bg-sand whitespace-nowrap">
          {copied === 'profile' ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 my-4">
        {artist.mediums?.map(m => (
          <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>
        ))}
      </div>

      <p className="text-ink mb-3 max-w-prose">{artist.bio}</p>
      <p className="text-sm font-mono text-ink-soft mb-14">
        From {artist.price_range} · {artist.turnaround} · Ships {artist.ships_to || 'by arrangement'}
      </p>

      <h2 className="text-xl mb-4">
        Artwork <span className="font-mono text-sm text-ink-soft font-normal">({filtered.length})</span>
      </h2>

      <div role="group" aria-label="Filter artwork" className="flex gap-x-7 border-b border-line mb-10">
        {([['all', 'All'], ['original', 'Originals'], ['print', 'Prints']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={tabClass(filter === t)}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          <p>{artworks.length === 0 ? 'No pieces listed yet.' : 'No pieces listed in this category yet.'}</p>
          {artworks.length > 0 && (
            <button onClick={() => setFilter('all')}
              className="mt-4 min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium text-ink hover:bg-sand">
              Show all pieces
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-14">
        {filtered.map(a => (
          <button key={a.id} onClick={() => setDetail(a)} className="group block w-full text-left">
            <span className="block aspect-square">
              {a.image_url ? (
                <FadeImage src={a.image_url} alt=""
                  className="w-full h-full object-contain object-bottom drop-shadow-sm motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]" />
              ) : (
                <span className="block w-full h-full bg-sand" />
              )}
            </span>
            <span className="block mt-4 font-display text-lg leading-snug">{a.title}</span>
            <span className="block text-xs text-ink-soft mt-1">{typeLabel(a.listing_type)}</span>
            <span className="block text-sm font-medium mt-2">
              {a.price}
              {a.status === 'sold' && (
                <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink text-cream align-middle">Sold</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {detail && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 overflow-y-auto" onClick={() => setDetail(null)}>
          <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
            <div role="dialog" aria-modal="true" aria-labelledby="detail-title"
              className="relative bg-card rounded-xl w-full max-w-4xl grid md:grid-cols-5 shadow-lg"
              onClick={e => e.stopPropagation()}>
              <button type="button" autoFocus onClick={() => setDetail(null)} aria-label="Close"
                className="absolute top-2 right-2 z-10 w-11 h-11 rounded-full bg-card/90 flex items-center justify-center text-xl text-ink hover:bg-sand">
                ×
              </button>

              <div className="md:col-span-3 p-6 sm:p-8 flex items-center justify-center bg-sand/50 rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                {detail.image_url ? (
                  <a href={detail.image_url} target="_blank" rel="noreferrer" aria-label="Open the full size image in a new tab">
                    <img src={detail.image_url} alt={detail.title}
                      className="max-h-[60vh] w-auto max-w-full object-contain drop-shadow-sm" />
                  </a>
                ) : (
                  <div className="w-full aspect-square bg-sand" />
                )}
              </div>

              <div className="md:col-span-2 p-6 sm:p-8">
                <p className="font-mono text-xs text-ink-soft mb-2">{typeLabel(detail.listing_type)}</p>
                <h2 id="detail-title" className="text-2xl mb-1 pr-10 md:pr-0">{detail.title}</h2>
                <p className="text-sm text-ink-soft mb-5">by {artist.name}</p>

                {detail.description && (
                  <p className="text-sm text-ink mb-6 whitespace-pre-line">{detail.description}</p>
                )}

                {specs.length > 0 && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm mb-6">
                    {specs.map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-ink-soft">{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="font-mono text-lg mb-5">
                  {detail.price}
                  {detail.status === 'sold' && (
                    <span className="ml-3 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink text-cream align-middle">Sold</span>
                  )}
                </p>

                {detail.status === 'sold' ? (
                  <p className="text-sm text-ink-soft mb-5">
                    This piece has been sold. You can{' '}
                    <Link href="/commission" className="underline text-blue-deep">request a commission</Link>{' '}
                    in a similar style.
                  </p>
                ) : (
                  <button onClick={() => openInquiry(detail)}
                    className="w-full min-h-11 bg-brand text-cream px-4 rounded-lg font-medium hover:bg-brand-deep mb-3">
                    Inquire About This Piece
                  </button>
                )}

                <button onClick={() => copy(window.location.origin + '/artist/' + id + '?piece=' + detail.id, 'piece')}
                  className="min-h-11 text-sm text-ink-soft underline hover:text-ink">
                  {copied === 'piece' ? 'Link copied' : 'Copy link to this piece'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inquiryFor && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setInquiryFor(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inquiry-title"
            className="relative bg-card rounded-xl p-7 max-w-sm w-full shadow-lg"
            onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setInquiryFor(null)} aria-label="Close"
              className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-xl text-ink-soft hover:text-ink">
              ×
            </button>

            {inquirySent ? (
              <>
                <h3 id="inquiry-title" className="text-xl mb-1">Inquiry sent.</h3>
                <p className="text-ink-soft text-sm mb-4">We&apos;ll pass this along and follow up soon.</p>
                <button onClick={() => setInquiryFor(null)}
                  className="min-h-11 text-sm font-medium border border-line px-5 rounded-lg hover:bg-sand">
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={sendInquiry} className="space-y-3">
                <h3 id="inquiry-title" className="text-xl mb-1 pr-8">Inquire About This Piece</h3>
                <p className="text-ink-soft text-sm mb-3">{inquiryFor.title}</p>
                <input required autoFocus placeholder="Your name" value={inquiryForm.buyerName}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerName: e.target.value })} className={inputClass} />
                <input required placeholder="Email or WhatsApp" value={inquiryForm.buyerContact}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerContact: e.target.value })} className={inputClass} />
                <textarea placeholder="Message (optional)" value={inquiryForm.message}
                  onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} className={inputClass} rows={3} />
                {inquiryError && <p className="text-red-600 text-sm">{inquiryError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={inquirySending}
                    className="flex-1 min-h-11 bg-brand text-cream px-4 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
                    {inquirySending ? 'Sending…' : 'Send Inquiry'}
                  </button>
                  <button type="button" onClick={() => setInquiryFor(null)}
                    className="min-h-11 border border-line bg-card px-4 rounded-lg hover:bg-sand">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}