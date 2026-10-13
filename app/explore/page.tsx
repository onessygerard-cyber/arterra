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
type View = 'artists' | 'all' | 'original' | 'print';
type Sort = 'newest' | 'price-low' | 'price-high';
type PriceRange = 'all' | 'under100' | '100-500' | 'over500';

const FAVORITES_KEY = 'arterra_favorites';

function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function toggleFavorite(id: string): string[] {
  const current = getFavorites();
  const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function extractPrice(priceStr: string): number {
  const num = parseFloat((priceStr || '').replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

const tabClass = (active: boolean) =>
  `min-h-11 px-1 text-sm font-medium border-b-2 -mb-px transition-colors ${
    active ? 'border-blue-deep text-ink' : 'border-transparent text-ink-soft hover:text-ink'
  }`;

const controlBase =
  'min-h-11 text-sm border rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

function EmptyState({ message, onReset }: { message: string; onReset?: () => void }) {
  return (
    <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
      <p>{message}</p>
      {onReset && (
        <button onClick={onReset}
          className="mt-4 min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium text-ink hover:bg-sand">
          Reset filters
        </button>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('artists');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/explore-data');
      const data = await res.json();
      setArtists(data.artists || []);
      setArtworks(data.artworks || []);
      setLoading(false);
    }
    load();
    setFavorites(getFavorites());
  }, []);

  function resetFilters() {
    setQuery('');
    setPriceRange('all');
    setShowFavoritesOnly(false);
  }

  const q = query.trim().toLowerCase();

  const filteredArtists = artists.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.mediums?.some(m => m.toLowerCase().includes(q))
  );

  const filteredArtworks = artworks
    .filter(a => view === 'all' || a.listing_type === view)
    .filter(a =>
      !q || a.title.toLowerCase().includes(q) || a.medium?.toLowerCase().includes(q) || a.artists?.name.toLowerCase().includes(q)
    )
    .filter(a => {
      if (priceRange === 'all') return true;
      const p = extractPrice(a.price);
      if (priceRange === 'under100') return p < 100;
      if (priceRange === '100-500') return p >= 100 && p <= 500;
      return p > 500;
    })
    .filter(a => !showFavoritesOnly || favorites.includes(a.id))
    .sort((a, b) => {
      if (sort === 'price-low') return extractPrice(a.price) - extractPrice(b.price);
      if (sort === 'price-high') return extractPrice(b.price) - extractPrice(a.price);
      return 0;
    });

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto mt-16 px-6 pb-20" aria-busy="true">
        <div className="h-7 w-48 bg-sand rounded motion-safe:animate-pulse mb-3" />
        <div className="h-4 w-24 bg-sand rounded motion-safe:animate-pulse mb-8" />
        <div className="h-11 bg-sand rounded-lg motion-safe:animate-pulse mb-5" />
        <div className="flex gap-7 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-6 w-16 bg-sand rounded motion-safe:animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[0, 1].map(i => (
            <div key={i} className="h-44 bg-sand rounded-xl motion-safe:animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <h1 className="text-2xl mb-1">Explore Artists</h1>
      <p className="text-ink-soft mb-8">{artists.length} verified</p>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input aria-label="Search" placeholder="Search by name, title, or medium…" value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full min-h-11 border border-line rounded-lg pl-11 pr-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
      </div>

      <div role="group" aria-label="Browse" className="flex flex-wrap gap-x-7 border-b border-line mb-10">
        {([
          ['artists', 'Artists'], ['all', 'All Art'], ['original', 'Originals'], ['print', 'Prints']
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={tabClass(view === v)}>
            {label}
          </button>
        ))}
      </div>

      {view === 'artists' ? (
        <>
          {filteredArtists.length === 0 && (
            artists.length === 0
              ? <EmptyState message="No artists yet. Applications are reviewed by hand." />
              : <EmptyState message="No artists match your search." onReset={resetFilters} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredArtists.map(a => (
              <Link key={a.id} href={`/artist/${a.id}`}
                className="block bg-card border border-line rounded-xl p-6 shadow-sm hover:border-blue/40">
                <h3 className="font-display text-lg mb-0.5">{a.name}</h3>
                <p className="text-sm text-ink-soft mb-3">{a.location}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.mediums?.map(m => (
                    <span key={m} className="text-xs bg-blue/10 text-blue-deep px-2.5 py-1 rounded-full font-medium">{m}</span>
                  ))}
                </div>
                <p className="text-sm text-ink-soft mb-4">{a.bio}</p>
                <p className="text-sm font-mono">From {a.price_range}</p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-8 flex-wrap">
            <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as Sort)}
              className={`${controlBase} border-line bg-card text-ink`}>
              <option value="newest">Newest first</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <select aria-label="Price range" value={priceRange} onChange={e => setPriceRange(e.target.value as PriceRange)}
              className={`${controlBase} border-line bg-card text-ink`}>
              <option value="all">Any price</option>
              <option value="under100">Under $100</option>
              <option value="100-500">$100–$500</option>
              <option value="over500">$500+</option>
            </select>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`${controlBase} font-medium ${showFavoritesOnly ? 'bg-blue-deep text-cream border-blue-deep' : 'bg-card text-ink border-line hover:bg-sand'}`}>
              ♥ Saved ({favorites.length})
            </button>
          </div>

          {filteredArtworks.length === 0 && (
            artworks.length === 0
              ? <EmptyState message="No artwork listed yet." />
              : <EmptyState message="No pieces match your filters." onReset={resetFilters} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-14">
            {filteredArtworks.map(a => {
              const href = `/artist/${a.artist_id}?piece=${a.id}`;
              const saved = favorites.includes(a.id);
              return (
                <div key={a.id} className="group">
                  <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
                    <div className="aspect-square">
                      {a.image_url ? (
                        <img src={a.image_url} alt=""
                          className="w-full h-full object-contain object-bottom drop-shadow-sm motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]" />
                      ) : (
                        <div className="w-full h-full bg-sand" />
                      )}
                    </div>
                  </Link>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <Link href={href} className="block min-w-0">
                      <span className="block font-display text-lg leading-snug">{a.title}</span>
                      <span className="block text-xs text-ink-soft mt-1">
                        {a.artists?.name} · {a.listing_type === 'original' ? 'Original' : 'Print'}
                      </span>
                      <span className="block text-sm font-medium mt-2">
                        {a.price}
                        {a.status === 'sold' && (
                          <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink text-cream align-middle">Sold</span>
                        )}
                      </span>
                    </Link>
                    <button onClick={() => setFavorites(toggleFavorite(a.id))}
                      aria-label={saved ? 'Remove from saved' : 'Save this piece'}
                      className={`w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-lg hover:text-ink ${saved ? 'text-ink' : 'text-ink-soft'}`}>
                      {saved ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}