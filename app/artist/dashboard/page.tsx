'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Artist = { id: string; name: string };
type Artwork = { id: string; title: string; listing_type: string; price: string; image_url: string; status: string; };
type Message = { id: string; from_label: string; text: string; created_at: string };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  briefs: { buyer_name: string; buyer_contact: string; description: string } | null;
  commission_messages: Message[];
};

const STAGE_LABELS: Record<string, string> = {
  proposed: 'New request', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered'
};

export default function ArtistDashboard() {
  const [checking, setChecking] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.push('/artist-login'); return; }
      const tok = data.session.access_token;
      setToken(tok);

      await fetch('/api/artist-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      });

      const res = await fetch('/api/my-artworks', { headers: { Authorization: `Bearer ${tok}` } });
      const body = await res.json();
      if (!res.ok) { setError(body.error || 'Could not load your dashboard.'); setChecking(false); return; }

      setArtist(body.artist);
      setArtworks(body.artworks);
      await loadCommissions(tok);
      setChecking(false);
    }
    init();
  }, [router]);

  async function loadCommissions(tok: string) {
    const res = await fetch('/api/artist-commissions', { headers: { Authorization: `Bearer ${tok}` } });
    const body = await res.json();
    if (res.ok) setCommissions(body.commissions || []);
  }

  async function sendMessage(commissionId: string) {
    const text = draft[commissionId]?.trim();
    if (!text || !artist) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionId, from: artist.name, text })
    });
    setDraft({ ...draft, [commissionId]: '' });
    loadCommissions(token);
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/artist-login');
  }
  
  async function toggleSold(artworkId: string, currentStatus: string) {
    const newStatus = currentStatus === 'sold' ? 'approved' : 'sold';
    const res = await fetch('/api/my-artworks/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ artworkId, status: newStatus })
    });
    if (!res.ok) { alert('Could not update this piece.'); return; }
    const res2 = await fetch('/api/my-artworks', { headers: { Authorization: `Bearer ${token}` } });
    const body2 = await res2.json();
    if (res2.ok) setArtworks(body2.artworks);
  }

  const STATUS_LABEL: Record<string, string> = { pending: 'Pending review', approved: 'Live', sold: 'Sold' };
  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-gold/20 text-gold-deep', approved: 'bg-blue/15 text-blue-deep', sold: 'bg-ink/10 text-ink',
  };

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (error) return <main className="max-w-4xl mx-auto mt-16 px-6"><p className="text-red-600">{error}</p></main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <div className="flex justify-between items-start gap-4 mb-10">
        <div>
          <h1 className="text-2xl mb-1">Welcome, {artist?.name}</h1>
          <p className="text-ink-soft text-sm">Manage your listed artwork and commissions.</p>
        </div>
        <button onClick={logout} className="text-sm border border-line px-3 py-1.5 rounded-full hover:bg-sand">
          Log Out
        </button>
      </div>

      <section className="mb-14">
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
                {a.status !== 'pending' && (
                  <button onClick={() => toggleSold(a.id, a.status)}
                    className="mt-3 w-full border border-line px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sand">
                    {a.status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-4">My Commissions <span className="font-mono text-sm text-ink-soft font-normal">({commissions.length})</span></h2>
        {commissions.length === 0 && (
          <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
            No commissions yet. You&apos;ll see them here once ARTERRA matches you with a buyer.
          </div>
        )}
        <div className="space-y-4">
          {commissions.map(c => {
            const messages = (c.commission_messages || []).slice().sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return (
              <div key={c.id} className="bg-card border border-line rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div>
                    <p className="font-medium">{c.briefs?.buyer_name || 'Buyer'}</p>
                    <p className="text-sm text-ink-soft">{c.briefs?.description}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${c.status === 'proposed' ? 'bg-gold/20 text-gold-deep' : 'bg-blue/15 text-blue-deep'}`}>
                    {STAGE_LABELS[c.status] || c.status}
                  </span>
                </div>
                <p className="text-sm font-mono text-ink-soft mb-4">{c.price} · {c.timeline}</p>

                <div className="border-t border-line pt-3 space-y-2 max-h-40 overflow-y-auto mb-3">
                  {messages.length === 0 && <p className="text-sm text-ink-soft/70">No messages yet.</p>}
                  {messages.map(m => (
                    <div key={m.id} className="text-sm bg-sand/60 rounded-lg px-3 py-2">
                      <span className="font-semibold text-xs block text-blue-deep">{m.from_label}</span>
                      {m.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input placeholder="Message the buyer…"
                    value={draft[c.id] || ''}
                    onChange={e => setDraft({ ...draft, [c.id]: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(c.id)}
                    className="flex-1 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
                  <button onClick={() => sendMessage(c.id)}
                    className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
                    Send
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}