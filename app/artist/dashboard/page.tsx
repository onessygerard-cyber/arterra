'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Artist = { id: string; name: string };
type Artwork = { id: string; title: string; listing_type: string; price: string; image_url: string; status: string; };

export default function ArtistDashboard() {
  const [checking, setChecking] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.push('/artist-login'); return; }

      await fetch('/api/artist-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      const res = await fetch('/api/my-artworks', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error || 'Could not load your dashboard.'); setChecking(false); return; }

      setArtist(body.artist);
      setArtworks(body.artworks);
      setChecking(false);
    }
    init();
  }, [router]);

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/artist-login');
  }

  const STATUS_LABEL: Record<string, string> = { pending: 'Pending review', approved: 'Live', sold: 'Sold' };
  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-gold/20 text-gold-deep',
    approved: 'bg-blue/15 text-blue-deep',
    sold: 'bg-ink/10 text-ink',
  };

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (error) return <main className="max-w-4xl mx-auto mt-16 px-6"><p className="text-red-600">{error}</p></main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <div className="flex justify-between items-start gap-4 mb-10">
        <div>
          <h1 className="text-2xl mb-1">Welcome, {artist?.name}</h1>
          <p className="text-ink-soft text-sm">Manage your listed artwork.</p>
        </div>
        <button onClick={logout} className="text-sm border border-line px-3 py-1.5 rounded-full hover:bg-sand">
          Log Out
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg">My Artworks <span className="font-mono text-sm text-ink-soft font-normal">({artworks.length})</span></h2>
        <Link href="/submit-artwork" className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
          Add New Artwork
        </Link>
      </div>

      {artworks.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          You haven&apos;t submitted any pieces yet.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {artworks.map(a => (
          <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
            {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-ink-soft mb-2">{a.listing_type === 'original' ? 'Original' : 'Print'} · {a.price}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[a.status] || ''}`}>
                {STATUS_LABEL[a.status] || a.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}