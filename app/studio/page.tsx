'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Artist = {
  id: string; name: string; contact: string; mediums: string[]; styles: string[];
  location: string; price_range: string; turnaround: string; bio: string; portfolio: string; status: string; photo_url?: string | null;
};
type Brief = {
  id: string; buyer_name: string; buyer_contact: string; description: string; medium: string;
  style: string; size: string; budget: string; location: string; reference_urls?: string[];
};
type Commission = {
  id: string; price: string; timeline: string; status: string;
  briefs: { buyer_name: string; buyer_contact: string; description: string; track_token?: string } | null;
  artists: { name: string; contact: string } | null;
};
type Artwork = {
  id: string; title: string; description: string; listing_type: string; medium: string; size: string;
  price: string; price_on_request?: boolean | null; image_url: string; status: string; is_featured?: boolean | null; artists: { name: string } | null;
};
type Inquiry = {
  id: string; buyer_name: string; buyer_contact: string; message: string; status: string;
  artworks: { title: string; artists: { name: string } | null } | null;
};

const STAGES = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];
const STAGE_LABELS: Record<string, string> = {
  proposed: 'Quoted', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered',
};

const card = 'bg-card border border-line rounded-xl p-5 shadow-sm';
const btnDark = 'min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep';
const btnLight = 'min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand';
const btnDanger = 'min-h-11 border border-red-300 text-red-800 bg-card px-4 rounded-lg text-sm font-medium hover:bg-red-50';
const inputClass = 'w-full min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

function SectionTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="text-lg mb-4">
      {title} <span className="font-mono text-sm text-ink-soft font-normal">({count})</span>
    </h2>
  );
}

function typeLabel(t: string) {
  return t === 'original' ? 'Original' : 'Print';
}

export default function StudioPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [newBriefs, setNewBriefs] = useState<Brief[]>([]);
  const [pendingArtists, setPendingArtists] = useState<Artist[]>([]);
  const [verifiedArtists, setVerifiedArtists] = useState<Artist[]>([]);
  const [otherArtists, setOtherArtists] = useState<Artist[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pendingArtworks, setPendingArtworks] = useState<Artwork[]>([]);
  const [liveArtworks, setLiveArtworks] = useState<Artwork[]>([]);
  const [offlineArtworks, setOfflineArtworks] = useState<Artwork[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'contacted' | 'converted'>('all');

  const [openMatchFor, setOpenMatchFor] = useState<string | null>(null);
  const [matchArtist, setMatchArtist] = useState<Record<string, string>>({});
  const [matchPrice, setMatchPrice] = useState<Record<string, string>>({});
  const [matchTimeline, setMatchTimeline] = useState<Record<string, string>>({});

  const [editingTerms, setEditingTerms] = useState<string | null>(null);
  const [termsPrice, setTermsPrice] = useState('');
  const [termsTimeline, setTermsTimeline] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.push('/studio/login'); return; }
      setChecking(false);
      loadData();
    }
    init();
  }, [router]);

  async function authFetch(url: string, init: RequestInit = {}) {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }

  async function loadData() {
    const res = await authFetch('/api/studio-data');
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    const data = await res.json();
    setNewBriefs(data.newBriefs || []);
    setPendingArtists(data.pendingArtists || []);
    setVerifiedArtists(data.verifiedArtists || []);
    setOtherArtists(data.otherArtists || []);
    setCommissions(data.commissions || []);
    setPendingArtworks(data.pendingArtworks || []);
    setLiveArtworks(data.liveArtworks || []);
    setOfflineArtworks(data.offlineArtworks || []);
    setInquiries(data.inquiries || []);
  }

  async function act(url: string, payload: Record<string, unknown>, failMessage: string): Promise<boolean> {
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return false;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || failMessage);
      return false;
    }
    await loadData();
    return true;
  }

  async function createCommission(briefId: string) {
    const artistId = matchArtist[briefId];
    const price = matchPrice[briefId]?.trim();
    const timeline = matchTimeline[briefId]?.trim();
    if (!artistId || !price || !timeline) { alert('Pick an artist and fill in price and timeline.'); return; }
    const ok = await act('/api/commissions', { briefId, artistId, price, timeline }, 'Could not create the commission.');
    if (ok) setOpenMatchFor(null);
  }

  async function archiveBrief(briefId: string) {
    if (!confirm('Archive this brief? It will leave the queue.')) return;
    await act('/api/briefs/update-status', { briefId, status: 'archived' }, 'Could not archive this brief.');
  }

  async function setArtistStatus(artistId: string, status: string) {
    await act('/api/artists/update-status', { artistId, status }, 'Could not update this artist.');
  }

  async function setArtworkStatus(artworkId: string, status: string) {
    await act('/api/artworks/update-status', { artworkId, status }, 'Could not update this artwork.');
  }

  async function removeArtwork(a: Artwork) {
    if (!confirm(`Remove "${a.title}" permanently? Its image and any inquiries about it are deleted too.`)) return;
    await act('/api/artworks/delete', { artworkId: a.id }, 'Could not remove this artwork.');
  }

  async function setCommissionStatus(commissionId: string, status: string) {
    await act('/api/commissions/update-status', { commissionId, status }, 'Could not update the status.');
  }

  async function setInquiryStatus(inquiryId: string, status: string) {
    await act('/api/artwork-inquiries/update-status', { inquiryId, status }, 'Could not update this inquiry.');
  }

  function startEditTerms(c: Commission) {
    setEditingTerms(c.id);
    setTermsPrice(c.price);
    setTermsTimeline(c.timeline);
  }

  async function saveTerms(commissionId: string) {
    if (!termsPrice.trim() || !termsTimeline.trim()) { alert('Add a price and a timeline.'); return; }
    const ok = await act('/api/commissions/update-terms', { commissionId, price: termsPrice, timeline: termsTimeline }, 'Could not save the terms.');
    if (ok) setEditingTerms(null);
  }

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  const visibleInquiries = inquiries.filter(i => inquiryFilter === 'all' || i.status === inquiryFilter);
  const artistCount = verifiedArtists.length + otherArtists.length;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <h1 className="text-2xl mb-6">Studio</h1>
      <a href="/studio/artists" className="block -mt-2 mb-6 text-sm underline text-blue-deep">Manage artist logins</a>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {[
          { label: 'New briefs', value: newBriefs.length, attention: true },
          { label: 'Artist applications', value: pendingArtists.length, attention: true },
          { label: 'Artwork submissions', value: pendingArtworks.length, attention: true },
          { label: 'New inquiries', value: inquiries.filter(i => i.status === 'new').length, attention: true },
          { label: 'Live artworks', value: liveArtworks.length, attention: false },
          { label: 'Active commissions', value: commissions.filter(c => c.status !== 'delivered').length, attention: false },
        ].map(s => (
          <div key={s.label} className="bg-card border border-line rounded-xl px-4 py-3 shadow-sm">
            <p className={`font-display text-2xl ${s.attention && s.value > 0 ? 'text-gold-deep' : 'text-ink'}`}>{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-14">
        <SectionTitle title="New briefs" count={newBriefs.length} />
        {newBriefs.length === 0 && <p className="text-ink-soft text-sm">No unmatched briefs right now.</p>}
        <div className="space-y-3">
          {newBriefs.map(b => (
            <div key={b.id} className={card}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{b.buyer_name}</p>
                  <p className="text-sm text-ink-soft mb-2">
                    {[b.medium, b.style, b.size, b.budget, b.location].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-sm">{b.description}</p>
                  {b.reference_urls && b.reference_urls.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {b.reference_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer">
                          <img src={u} alt={`Reference ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-line" />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-ink-soft/70 mt-2 font-mono">{b.buyer_contact}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button onClick={() => setOpenMatchFor(openMatchFor === b.id ? null : b.id)}
                    className="min-h-11 bg-gold/15 text-gold-deep px-4 rounded-full text-sm font-medium hover:bg-gold/25 whitespace-nowrap">
                    Propose a match
                  </button>
                  <button onClick={() => archiveBrief(b.id)}
                    className="min-h-11 px-2 text-sm text-ink-soft underline hover:text-ink">
                    Archive
                  </button>
                </div>
              </div>

              {openMatchFor === b.id && (
                <div className="mt-4 pt-4 border-t border-line space-y-2">
                  {verifiedArtists.length === 0 ? (
                    <p className="text-sm text-red-600">No verified artists yet. Approve one first.</p>
                  ) : (
                    <>
                      <select className={inputClass} value={matchArtist[b.id] || ''}
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
                      <button onClick={() => createCommission(b.id)} className={btnDark}>Create commission</button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Artist applications" count={pendingArtists.length} />
        {pendingArtists.length === 0 && <p className="text-ink-soft text-sm">No applications waiting on review.</p>}
        <div className="space-y-3">
          {pendingArtists.map(a => (
            <div key={a.id} className={card}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-ink-soft mb-2">
                    {[a.mediums?.join(', '), a.price_range, a.turnaround, a.location].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-sm mb-2">{a.bio}</p>
                  <p className="text-sm text-ink-soft mb-2"><span className="font-medium text-ink">Portfolio:</span> {a.portfolio}</p>
                  <p className="text-xs text-ink-soft/70 font-mono">{a.contact}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setArtistStatus(a.id, 'verified')} className={btnDark}>Approve</button>
                  <button onClick={() => setArtistStatus(a.id, 'rejected')} className={btnDanger}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Artists" count={artistCount} />
        {artistCount === 0 && <p className="text-ink-soft text-sm">No approved artists yet.</p>}
        <div className="space-y-3">
          {verifiedArtists.map(a => (
            <div key={a.id} className={`${card} flex justify-between items-center gap-3`}>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs font-mono text-ink-soft">{a.contact} · Live</p>
                {a.photo_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={a.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-line" />
                    <button className="min-h-11 text-xs underline text-ink-soft hover:text-ink"
                      onClick={() => act('/api/artists/clear-photo', { artistId: a.id }, 'Could not remove the photo.')}>
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
              <button className={btnLight}
                onClick={() => {
                  if (confirm(`Suspend ${a.name}? Their profile and artwork disappear from the site.`)) {
                    setArtistStatus(a.id, 'suspended');
                  }
                }}>
                Suspend
              </button>
            </div>
          ))}
          {otherArtists.map(a => (
            <div key={a.id} className={`${card} flex justify-between items-center gap-3 opacity-80`}>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs font-mono text-ink-soft">
                  {a.contact} · {a.status === 'rejected' ? 'Rejected' : 'Suspended'}
                </p>
              </div>
              <button className={btnLight}
                onClick={() => setArtistStatus(a.id, a.status === 'rejected' ? 'pending' : 'verified')}>
                Restore
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Artwork submissions" count={pendingArtworks.length} />
        {pendingArtworks.length === 0 && <p className="text-ink-soft text-sm">No artwork waiting on review.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingArtworks.map(a => (
            <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-ink-soft">{a.artists?.name} · {typeLabel(a.listing_type)}</p>
                  </div>
                  <span className="text-xs font-mono text-ink-soft whitespace-nowrap">{a.price_on_request || !a.price ? 'On request' : a.price}</span>
                </div>
                <p className="text-sm text-ink-soft mt-2">{[a.medium, a.size].filter(Boolean).join(' · ')}</p>
                {a.description && <p className="text-sm mt-2">{a.description}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setArtworkStatus(a.id, 'approved')} className={`${btnDark} flex-1`}>Approve</button>
                  <button onClick={() => setArtworkStatus(a.id, 'rejected')} className={`${btnDanger} flex-1`}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Live artwork" count={liveArtworks.length} />
        {liveArtworks.length === 0 && <p className="text-ink-soft text-sm">Nothing live yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {liveArtworks.map(a => (
            <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">
                      {a.title}
                      {a.status === 'sold' && (
                        <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink text-cream align-middle">Sold</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">{a.artists?.name} · {typeLabel(a.listing_type)}</p>
                  </div>
                  <span className="text-xs font-mono text-ink-soft whitespace-nowrap">{a.price_on_request || !a.price ? 'On request' : a.price}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className={btnLight}
                    onClick={() => setArtworkStatus(a.id, a.status === 'sold' ? 'approved' : 'sold')}>
                    {a.status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}
                  </button>
                  {a.status === 'approved' && (
                    <button className={btnLight}
                      onClick={() => act('/api/artworks/feature', { artworkId: a.id, featured: !a.is_featured }, 'Could not update this piece.')}>
                      {a.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                  )}
                  <button className={btnLight} onClick={() => setArtworkStatus(a.id, 'hidden')}>Unpublish</button>
                  <button className={btnDanger} onClick={() => removeArtwork(a)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Hidden and rejected artwork" count={offlineArtworks.length} />
        {offlineArtworks.length === 0 && <p className="text-ink-soft text-sm">Nothing here.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offlineArtworks.map(a => (
            <div key={a.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm opacity-90">
              {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover" />}
              <div className="p-4">
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-ink-soft">
                  {a.artists?.name} · {a.status === 'rejected' ? 'Rejected' : 'Hidden'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button className={btnLight}
                    onClick={() => setArtworkStatus(a.id, a.status === 'rejected' ? 'pending' : 'approved')}>
                    Restore
                  </button>
                  <button className={btnDanger} onClick={() => removeArtwork(a)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle title="Inquiries" count={inquiries.length} />
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'new', 'contacted', 'converted'] as const).map(f => (
            <button key={f} onClick={() => setInquiryFilter(f)}
              className={`min-h-11 text-sm font-medium px-4 rounded-full ${inquiryFilter === f ? 'bg-ink text-cream' : 'bg-sand text-ink-soft hover:text-ink'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {visibleInquiries.length === 0 && (
          <p className="text-ink-soft text-sm">No inquiries {inquiryFilter === 'all' ? 'yet' : 'with this status'}.</p>
        )}
        <div className="space-y-3">
          {visibleInquiries.map(i => (
            <div key={i.id} className={card}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{i.buyer_name}</p>
                  <p className="text-sm text-ink-soft mb-2">
                    On &ldquo;{i.artworks?.title}&rdquo; by {i.artworks?.artists?.name}
                  </p>
                  {i.message && <p className="text-sm mb-2">{i.message}</p>}
                  <p className="text-xs text-ink-soft/70 font-mono">{i.buyer_contact}</p>
                </div>
                <select className="min-h-11 border border-line rounded-lg px-2.5 text-sm font-mono bg-cream"
                  value={i.status} onChange={e => setInquiryStatus(i.id, e.target.value)}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="All commissions" count={commissions.length} />
        {commissions.length === 0 && <p className="text-ink-soft text-sm">No commissions yet. Match a brief above to create one.</p>}
        <div className="space-y-3">
          {commissions.map(c => (
            <div key={c.id} className={card}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{c.briefs?.buyer_name || 'Buyer'} → {c.artists?.name || 'Artist'}</p>
                  <p className="text-sm text-ink-soft">{c.price} · {c.timeline}</p>
                  <p className="text-xs text-ink-soft/70 font-mono mt-1">
                    {c.briefs?.buyer_contact} {c.artists?.contact ? '· ' + c.artists.contact : ''}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {c.briefs?.track_token && (
                      <button className="min-h-11 text-xs border border-line px-3 rounded-full hover:bg-sand"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/track?token=${c.briefs?.track_token}`);
                          alert('Tracking link copied.');
                        }}>
                        Copy tracking link
                      </button>
                    )}
                    <button className="min-h-11 text-xs border border-line px-3 rounded-full hover:bg-sand"
                      onClick={() => startEditTerms(c)}>
                      Edit terms
                    </button>
                  </div>
                </div>
                <select className="min-h-11 border border-line rounded-lg px-2.5 text-sm font-mono bg-cream"
                  value={c.status} onChange={e => setCommissionStatus(c.id, e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>

              {editingTerms === c.id && (
                <div className="mt-4 pt-4 border-t border-line space-y-2">
                  <input className={inputClass} placeholder="Price" value={termsPrice}
                    onChange={e => setTermsPrice(e.target.value)} />
                  <input className={inputClass} placeholder="Timeline" value={termsTimeline}
                    onChange={e => setTermsTimeline(e.target.value)} />
                  <p className="text-xs text-ink-soft">The buyer and the artist will both see a message about this change.</p>
                  <div className="flex gap-2">
                    <button className={btnDark} onClick={() => saveTerms(c.id)}>Save terms</button>
                    <button className={btnLight} onClick={() => setEditingTerms(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}