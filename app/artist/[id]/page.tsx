'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

const pillClass = (active: boolean) =>
  `inline-flex items-center min-h-11 text-sm font-medium px-4 rounded-full border transition-colors ${
    active
      ? 'bg-ink text-cream border-ink'
      : 'bg-card text-ink-soft border-line hover:bg-sand hover:text-ink'
  }`;

function framedLabel(s: string) {
  if (s === 'framed') return 'Framed';
  if (s === 'stretched') return 'Stretched canvas';
  if (s === 'unframed') return 'Unframed';
  return '';
}

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [lightbox, setLightbox] = useState<Artwork | null>(null);
  const [inquiryForm, setInquiryForm] = useState({ buyerName: '', buyerContact: '', message: '' });
  const [inquirySent, setInquirySent] = useState(false);
  const [inquirySending, setInquirySending] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/artist-profile?id=' + id);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setArtist(data.artist);
      setArtworks(data.artworks);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!activeArtwork && !lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setActiveArtwork(null); setLightbox(null); }
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeArtwork, lightbox]);

  function openInquiry(a: Artwork) {
    setActiveArtwork(a);
    setInquirySent(false);
    setInquiryError('');
  }

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!activeArtwork) return;
    setInquirySending(true);
    setInquiryError('');
    try {
      const res = await fetch('/api/artwork-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: activeArtwork.id, ...inquiryForm })
      });
      if (res.ok) setInquirySent(true);
      else setInquiryError('Something went wrong. Please try again.');
    } catch {
      setInquiryError('We could not send that. Check your connection and try again.');
    }
    setInquirySending(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-[4/3] bg-sand rounded-xl motion-safe:animate-pulse" />
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

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h1 className="text-3xl mb-1">{artist.name}</h1>
          <p className="text-ink-soft">{artist.location}</p>
        </div>
        <button onClick={copyLink}
          className="min-h-11 text-sm font-medium border border-line bg-card px-4 rounded-full hover:bg-sand whitespace-nowrap">
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 my-4">
        {artist.mediums?.map(m => (
          <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>
        ))}
      </div>

      <p className="text-ink mb-3 max-w-prose">{artist.bio}</p>
      <p className="text-sm font-mono text-ink-soft mb-12">
        From {artist.price_range} · {artist.turnaround} · Ships {artist.ships_to || 'by arrangement'}
      </p>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl">
          Artwork <span className="font-mono text-sm text-ink-soft font-normal">({filtered.length})</span>
        </h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([['all', 'All'], ['original', 'Originals'], ['print', 'Prints']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setFilter(t)} className={pillClass(filter === t)}>{label}</button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filtered.map(a => (
          <div key={a.id}
            className="group bg-card border border-line rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            <div className="relative overflow-hidden">
              {a.image_url ? (
                <button onClick={() => setLightbox(a)} aria-label={`View ${a.title} larger`}
                  className="block w-full cursor-zoom-in">
                  <img src={a.image_url} alt={a.title}
                    className="w-full aspect-[4/3] object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]" />
                </button>
              ) : (
                <div className="w-full aspect-[4/3] bg-sand" />
              )}
              <span className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-badge text-badge-ink pointer-events-none">
                {a.listing_type === 'original' ? 'Original' : 'Print'}
              </span>
              {a.status === 'sold' && (
                <span className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-ink text-cream pointer-events-none">Sold</span>
              )}
            </div>
            <div className="p-4">
              <p className="font-medium">{a.title}{a.year ? `, ${a.year}` : ''}</p>
              <p className="text-xs text-ink-soft mb-3">
                {[a.medium, a.style, a.size, framedLabel(a.framed_status)].filter(Boolean).join(' · ')}
              </p>
              <div className="flex justify-between items-center gap-3">
                <span className="font-mono text-sm">{a.price}</span>
                {a.status !== 'sold' && (
                  <button onClick={() => openInquiry(a)}
                    className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-blue-deep">
                    Inquire
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setLightbox(null)}>
          <div role="dialog" aria-modal="true" aria-label={lightbox.title}
            className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setLightbox(null)} aria-label="Close"
              className="absolute top-2 right-2 w-11 h-11 rounded-full bg-cream/90 flex items-center justify-center text-xl text-ink hover:bg-cream">
              ×
            </button>
            <img src={lightbox.image_url} alt={lightbox.title}
              className="max-h-[80vh] max-w-full object-contain rounded-lg" />
            <p className="text-cream text-sm mt-3 text-center">
              {lightbox.title}{lightbox.year ? `, ${lightbox.year}` : ''}
            </p>
          </div>
        </div>
      )}

      {activeArtwork && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setActiveArtwork(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inquiry-title"
            className="relative bg-card rounded-xl p-7 max-w-sm w-full shadow-lg"
            onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setActiveArtwork(null)} aria-label="Close"
              className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-xl text-ink-soft hover:text-ink">
              ×
            </button>

            {inquirySent ? (
              <>
                <h3 id="inquiry-title" className="text-xl mb-1">Inquiry sent.</h3>
                <p className="text-ink-soft text-sm mb-4">We&apos;ll pass this along and follow up soon.</p>
                <button onClick={() => setActiveArtwork(null)}
                  className="min-h-11 text-sm font-medium border border-line px-5 rounded-lg hover:bg-sand">
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={sendInquiry} className="space-y-3">
                <h3 id="inquiry-title" className="text-xl mb-1 pr-8">Inquire About This Piece</h3>
                <p className="text-ink-soft text-sm mb-3">{activeArtwork.title}</p>
                <input required autoFocus placeholder="Your name" value={inquiryForm.buyerName}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerName: e.target.value })} className={inputClass} />
                <input required placeholder="Email or WhatsApp" value={inquiryForm.buyerContact}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerContact: e.target.value })} className={inputClass} />
                <textarea placeholder="Message (optional)" value={inquiryForm.message}
                  onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} className={inputClass} rows={3} />
                {inquiryError && <p className="text-red-600 text-sm">{inquiryError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={inquirySending}
                    className="flex-1 min-h-11 bg-ink text-cream px-4 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
                    {inquirySending ? 'Sending…' : 'Send Inquiry'}
                  </button>
                  <button type="button" onClick={() => setActiveArtwork(null)}
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