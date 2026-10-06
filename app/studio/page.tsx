'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Artist = { id: string; name: string; contact: string; mediums: string[]; styles: string[]; location: string; price_range: string; turnaround: string; bio: string; portfolio: string; };
type Brief = { id: string; buyer_name: string; buyer_contact: string; description: string; medium: string; style: string; size: string; budget: string; location: string; };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  briefs: { buyer_name: string; buyer_contact: string; description: string } | null;
  artists: { name: string; contact: string } | null;
};
type Artwork = {
  id: string; title: string; description: string; listing_type: string;
  medium: string; size: string; price: string; image_url: string;
  artists: { name: string } | null;
};

const STAGES = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];
const STAGE_LABELS: Record<string, string> = {
  proposed: 'Quoted', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered'
};

export default function StudioPage() {
  const [checking, setChecking] = useState(true);
  const [newBriefs, setNewBriefs] = useState<Brief[]>([]);
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([]);
  const [verifiedArtists, setVerifiedArtists] = useState<Artist[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [openMatchFor, setOpenMatchFor] = useState<string | null>(null);
  const [matchArtist, setMatchArtist] = useState<Record<string, string>>({});
  const [matchPrice, setMatchPrice] = useState<Record<string, string>>({});
  const [matchTimeline, setMatchTimeline] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.push('/studio/login'); return; }
      setChecking(false);
      loadData();
    }
    init();
  }, [router]);

  async function loadData() {
    const res = await fetch('/api/studio-data');
    const data = await res.json();
    setNewBriefs(data.newBriefs || []);
    setPendingArtists(data.pendingArtists || []);
    setVerifiedArtists(data.verifiedArtists || []);
    setCommissions(data.commissions || []);
    setPendingArtworks(data.pendingArtworks || []);
  }

  async function createCommission(briefId: string) {
    const artistId = matchArtist[briefId];
    const price = matchPrice[briefId];
    const timeline = matchTimeline[briefId];
    if (!artistId || !price || !timeline) { alert('Pick an artist and fill in price and timeline.'); return; }

    const res = await fetch('/api/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, artistId, price, timeline })
    });
    if (!res.ok) { alert('Something went wrong creating the commission.'); return; }

    setOpenMatchFor(null);
    loadData();
  }

  async function updateStatus(commissionId: string, status: string) {
    const res = await fetch('/api/commissions/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionId, status })
    });
    if (!res.ok) { alert('Could not update status.'); return; }
    loadData();
  }

  async function approveArtwork(artworkId: string) {
    const res = await fetch('/api/artworks/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId, status: 'approved' })
    });
    if (!res.ok) { alert('Could not approve this artwork.'); return; }
    loadData();
  }

  
  async function approveArtist(artistId: string) {
    const res = await fetch('/api/artists/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId, status: 'verified' })
    });
    if (!res.ok) { alert('Could not approve this artist.'); return; }
    loadData();
  }

  const inputClass = "w-full border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) {
    return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  }

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <h1 className="text-2xl mb-10">Studio</h1>

      <section className="mb-14">
        <h2 className="text-lg mb-4">New briefs <span className="font-mono text-sm text-ink-soft font-normal">({newBriefs.length})</span></h2>
        {newBriefs.length === 0 && <p className="text-ink-soft text-sm">No unmatched briefs right now.</p>}
        <div className="space-y-3">
          {newBriefs.map(b => (
            <div key={b.id} className="bg-card border border-line rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{b.buyer_name}</p>
                  <p className="text-sm text-ink-soft mb-2">{b.medium} · {b.style} · {b.size} · {b.budget} · {b.location}</p>
                  <p className="text-sm">{b.description}</p>
                  <p className="text-xs text-ink-soft/70 mt-2 font-mono">{b.buyer_contact}</p>
                </div>
                <button onClick={() => setOpenMatchFor(openMatchFor === b.id ? null : b.id)}
                  className="text-sm bg-gold/15 text-gold-deep px-3 py-1.5 rounded-full font-medium whitespace-nowrap hover:bg-gold/25">
                  Propose a match
                </button>
              </div>

              {openMatchFor === b.id && (
                <div className="mt-4 pt-4 border-t border-line space-y-2">
                  {verifiedArtists.length === 0 ? (
                    <p className="text-sm text-red-600">No verified artists yet. Approve one first.</p>
                  ) : (
                    <>
                      <select className={inputClass}
                        value={matchArtist[b.id] || ''}
                        onChange={e => setMatchArtist({ ...matchArtist, [b.id]: e.target.value })}>
                        <option value="">Choose an artist…</option>
                        {verifiedArtists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <input placeholder="Quoted price, e.g. $650" className={inputClass}
                        value={matchPrice[b.id] || ''}
                        onChange={e => setMatchPrice({ ...matchPrice, [b.id]: e.target.value })} />
                      <input placeholder="Timeline, e.g. 25 days" className={inputClass}
                        value={matchTimeline[b.id] || ''}
                        onChange={e => setMatchTimeline({ ...matchTimeline, [b.id]: e.target.value })} />
                      <button onClick={() => createCommission(b.id)}
                        className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
                        Create commission
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

            <section className="mb-14">
        <h2 className="text-lg mb-4">Artist applications <span className="font-mono text-sm text-ink-soft font-normal">({pendingArtists.length})</span></h2>
        {pendingArtists.length === 0 && <p className="text-ink-soft text-sm">No applications waiting on review.</p>}
        <div className="space-y-3">
          {pendingArtists.map(a => (
            <div key={a.id} className="bg-card border border-line rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-ink-soft mb-2">{a.mediums?.join(', ')} · {a.price_range} · {a.turnaround} · {a.location}</p>
                  <p className="text-sm mb-2">{a.bio}</p>
                  <p className="text-xs text-ink-soft/70 font-mono">{a.contact}</p>
                </div>
                <button onClick={() => approveArtist(a.id)}
                  className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep whitespace-nowrap">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-lg mb-4">Artwork submissions <span className="font-mono text-sm text-ink-soft font-normal">({pendingArtworks.length})</span></h2>
        {pendingArtworks.length === 0 && <p className="text-ink-soft text-sm">No artwork waiting on review.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingArtworks.map(a => (
            <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-ink-soft">{a.artists?.name} · {a.listing_type === 'original' ? 'Original' : 'Print'}</p>
                  </div>
                  <span className="text-xs font-mono text-ink-soft whitespace-nowrap">{a.price}</span>
                </div>
                <p className="text-sm text-ink-soft mt-2">{a.medium} · {a.size}</p>
                <button onClick={() => approveArtwork(a.id)}
                  className="mt-3 w-full bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-4">All commissions <span className="font-mono text-sm text-ink-soft font-normal">({commissions.length})</span></h2>
        {commissions.length === 0 && <p className="text-ink-soft text-sm">No commissions yet. Match a brief above to create one.</p>}
        <div className="space-y-3">
          {commissions.map(c => (
            <div key={c.id} className="bg-card border border-line rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{c.briefs?.buyer_name || 'Buyer'} → {c.artists?.name || 'Artist'}</p>
                  <p className="text-sm text-ink-soft">{c.price} · {c.timeline}</p>
                  <p className="text-xs text-ink-soft/70 font-mono mt-1">
                    {c.briefs?.buyer_contact} {c.artists?.contact ? '· ' + c.artists.contact : ''}
                  </p>
                </div>
                <select className="border border-line rounded-lg px-2.5 py-1.5 text-sm font-mono bg-cream"
                  value={c.status}
                  onChange={e => updateStatus(c.id, e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}