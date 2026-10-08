'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Artist = { id: string; name: string; location: string; bio: string; price_range: string; turnaround: string; mediums: string[]; styles: string[]; ships_to: string; };
type Artwork = { id: string; title: string; description: string; listing_type: string; medium: string; size: string; price: string; image_url: string; status: string; year: string; framed_status: string; style: string; };

export default function ArtistProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filter, setFilter] = useState<'all' | 'original' | 'print'>('all');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [inquiryForm, setInquiryForm] = useState({ buyerName: '', buyerContact: '', message: '' });
  const [inquirySent, setInquirySent] = useState(false);

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

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!activeArtwork) return;
    await fetch('/api/artwork-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: activeArtwork.id, ...inquiryForm })
    });
    setInquirySent(true);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = artworks.filter(a => filter === 'all' || a.listing_type === filter);
  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (loading) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (notFound || !artist) return <main className="max-w-4xl mx-auto mt-16 px-6"><p className="text-ink-soft">Artist not found.</p></main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
           <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h1 className="text-3xl mb-1">{artist.name}</h1>
          <p className="text-ink-soft">{artist.location}</p>
        </div>
        <div className="flex gap-2">

          <button onClick={copyLink} className="text-sm border border-line px-3 py-1.5 rounded-full hover:bg-sand whitespace-nowrap">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 my-4">
        {artist.mediums?.map(m => <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>)}
      </div>

      <p className="text-ink-soft mb-2 max-w-prose">{artist.bio}</p>
      <p className="text-sm font-mono text-ink-soft mb-10">From {artist.price_range} · {artist.turnaround} · Ships {artist.ships_to || 'by arrangement'}</p>

      <div className="flex gap-2 mb-6">
        {(['all', 'original', 'print'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full ${filter === t ? 'bg-ink text-cream' : 'bg-sand text-ink-soft hover:text-ink'}`}>
            {t === 'all' ? 'All' : t === 'original' ? 'Originals' : 'Prints'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          No pieces listed in this category yet.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filtered.map(a => (
          <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
            <div className="relative">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-44 object-cover" />}
              <span className={`absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full ${a.listing_type === 'original' ? 'bg-gold text-ink' : 'bg-blue text-cream'}`}>
                {a.listing_type === 'original' ? 'Original' : 'Print'}
              </span>
              {a.status === 'sold' && (
                <span className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-ink text-cream">Sold</span>
              )}
            </div>
            <div className="p-4">
              <p className="font-medium">{a.title}{a.year ? `, ${a.year}` : ''}</p>
              <p className="text-xs text-ink-soft mb-2">{a.medium} · {a.size} {a.framed_status && `· ${a.framed_status === 'framed' ? 'Framed' : a.framed_status === 'stretched' ? 'Stretched canvas' : 'Unframed'}`}</p>
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{a.price}</span>
                {a.status !== 'sold' && (
                  <button onClick={() => { setActiveArtwork(a); setInquirySent(false); }}
                    className="text-sm bg-ink text-cream px-3 py-1.5 rounded-lg font-medium hover:bg-blue-deep">
                    Inquire
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeArtwork && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-6 z-50" onClick={() => setActiveArtwork(null)}>
          <div className="bg-card rounded-xl p-7 max-w-sm w-full shadow-sm" onClick={e => e.stopPropagation()}>
            {inquirySent ? (
              <>
                <h3 className="text-xl mb-1">Inquiry sent.</h3>
                <p className="text-ink-soft text-sm mb-4">We&apos;ll pass this along and follow up soon.</p>
                <button onClick={() => setActiveArtwork(null)} className="text-sm border border-line px-4 py-2 rounded-lg hover:bg-sand">Close</button>
              </>
            ) : (
              <form onSubmit={sendInquiry} className="space-y-3">
                <h3 className="text-xl mb-1">Inquire About This Piece</h3>
                <p className="text-ink-soft text-sm mb-3">{activeArtwork.title}</p>
                <input required placeholder="Your name" value={inquiryForm.buyerName}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerName: e.target.value })} className={inputClass} />
                <input required placeholder="Email or WhatsApp" value={inquiryForm.buyerContact}
                  onChange={e => setInquiryForm({ ...inquiryForm, buyerContact: e.target.value })} className={inputClass} />
                <textarea placeholder="Message (optional)" value={inquiryForm.message}
                  onChange={e => setInquiryForm({ ...inquiryForm, message: e.target.value })} className={inputClass} rows={3} />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-ink text-cream px-4 py-2.5 rounded-lg font-medium hover:bg-blue-deep">Send Inquiry</button>
                  <button type="button" onClick={() => setActiveArtwork(null)} className="border border-line px-4 py-2.5 rounded-lg hover:bg-sand">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}