'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Artist = {
  id: string; name: string; location: string; mediums: string[]; styles: string[];
  bio: string; price_range: string;
};
type Artwork = {
  id: string; title: string; listing_type: string; medium: string; price: string;
  image_url: string; artist_id: string; status: string; artists: { name: string } | null;
};

export default function ExplorePage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'artists' | 'all' | 'original' | 'print'>('artists');
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/explore-data');
      const data = await res.json();
      setArtists(data.artists || []);
      setArtworks(data.artworks || []);
      setLoading(false);
    }
    load();
  }, []);

  const q = query.trim().toLowerCase();

  const filteredArtists = artists.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.mediums?.some(m => m.toLowerCase().includes(q))
  );

  const filteredArtworks = artworks
    .filter(a => view === 'all' || a.listing_type === view)
    .filter(a =>
      !q || a.title.toLowerCase().includes(q) || a.medium?.toLowerCase().includes(q) || a.artists?.name.toLowerCase().includes(q)
    );

  if (loading) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <h1 className="text-2xl mb-1">Explore Artists</h1>
      <p className="text-ink-soft mb-6">{artists.length} verified</p>

      <input placeholder="Search by name, title, or medium…" value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full border border-line rounded-lg px-4 py-2.5 bg-card mb-5 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />

      <div className="flex gap-2 mb-8 flex-wrap">
        {([
          ['artists', 'Artists'], ['all', 'All Art'], ['original', 'Originals'], ['print', 'Prints']
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full ${view === v ? 'bg-ink text-cream' : 'bg-sand text-ink-soft hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {view === 'artists' ? (
        <>
          {filteredArtists.length === 0 && (
            <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
              {artists.length === 0 ? 'No artists yet. Applications are reviewed by hand.' : 'No artists match your search.'}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredArtists.map(a => (
              <Link key={a.id} href={`/artist/${a.id}`} className="block bg-card border border-line rounded-xl p-6 shadow-sm hover:border-blue/40">
                <h3 className="font-display text-lg mb-0.5">{a.name}</h3>
                <p className="text-sm text-ink-soft mb-3">{a.location}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.mediums?.map(m => <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>)}
                </div>
                <p className="text-sm text-ink-soft mb-4">{a.bio}</p>
                <p className="text-sm font-mono">From {a.price_range}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {filteredArtworks.length === 0 && (
            <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
              No pieces match yet.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredArtworks.map(a => (
              <Link key={a.id} href={`/artist/${a.artist_id}`} className="block bg-card border border-line rounded-xl overflow-hidden shadow-sm hover:border-blue/40">
                <div className="relative">
                  {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />}
                  <span className={`absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full ${a.listing_type === 'original' ? 'bg-gold text-ink' : 'bg-blue text-cream'}`}>
                    {a.listing_type === 'original' ? 'Original' : 'Print'}
                  </span>
                  {a.status === 'sold' && (
                    <span className="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-ink text-cream">Sold</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-ink-soft mb-1">{a.artists?.name}</p>
                  <p className="text-sm font-mono">{a.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}