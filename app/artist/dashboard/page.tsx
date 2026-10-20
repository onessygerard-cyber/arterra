'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Artist = { id: string; name: string };
type Artwork = {
  id: string; title: string; description: string | null; listing_type: string;
  medium: string | null; size: string | null; price: string | null;
  price_on_request: boolean | null; image_url: string; status: string;
  year: string | null; framed_status: string | null; style: string | null;
};
type Message = { id: string; from_label: string; text: string; created_at: string };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  briefs: { buyer_name: string; description: string } | null;
  commission_messages: Message[];
  reference_urls?: string[];
};

const STAGE_LABELS: Record<string, string> = {
  proposed: 'New request', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending review', approved: 'Live', sold: 'Sold', rejected: 'Not accepted', hidden: 'Hidden',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gold/20 text-gold-deep',
  approved: 'bg-blue/15 text-blue-deep',
  sold: 'bg-ink/10 text-ink',
  rejected: 'bg-red-100 text-red-800',
  hidden: 'bg-ink/10 text-ink-soft',
};

const inputClass = "w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";
const btnLight = "min-h-11 border border-line bg-card px-3 rounded-lg text-xs font-medium hover:bg-sand";
const btnDanger = "min-h-11 border border-red-300 text-red-800 bg-card px-3 rounded-lg text-xs font-medium hover:bg-red-50";

function priceText(a: Artwork): string {
  const p = (a.price || '').trim();
  return a.price_on_request || !p ? 'Price on request' : p;
}

export default function ArtistDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<Artwork | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', listingType: 'original', medium: '', size: '',
    year: '', style: '', framedStatus: '', price: '', priceOnRequest: false,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  async function authFetch(url: string, init: RequestInit = {}) {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }

  function postJson(url: string, payload: Record<string, unknown>) {
    return authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async function reloadArtworks() {
    const res = await authFetch('/api/my-artworks');
    if (res.ok) {
      const body = await res.json();
      setArtist(body.artist);
      setArtworks(body.artworks);
    }
  }

  async function loadCommissions() {
    const res = await authFetch('/api/artist-commissions');
    if (res.ok) {
      const body = await res.json();
      setCommissions(body.commissions || []);
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.replace('/artist-login'); return; }
      const res = await fetch('/api/my-artworks', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not load your dashboard.');
        setChecking(false);
        return;
      }
      setArtist(body.artist);
      setArtworks(body.artworks);
      await loadCommissions();
      setChecking(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditing(null);
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [editing]);

  async function sendMessage(commissionId: string) {
    const text = draft[commissionId]?.trim();
    if (!text) return;
    const res = await postJson('/api/messages', { commissionId, text });
    if (!res.ok) { alert('Your message could not be sent. Please try again.'); return; }
    setDraft({ ...draft, [commissionId]: '' });
    loadCommissions();
  }

  async function toggleSold(a: Artwork) {
    const status = a.status === 'sold' ? 'approved' : 'sold';
    const res = await postJson('/api/my-artworks/update-status', { artworkId: a.id, status });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Could not update this piece.');
      return;
    }
    reloadArtworks();
  }

  async function removeArtwork(a: Artwork) {
    if (!confirm(`Remove "${a.title}" permanently? Its photo and any inquiries about it will be deleted.`)) return;
    const res = await postJson('/api/my-artworks/delete', { artworkId: a.id });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Could not remove this piece.');
      return;
    }
    reloadArtworks();
  }

  function openEdit(a: Artwork) {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description || '',
      listingType: a.listing_type,
      medium: a.medium || '',
      size: a.size || '',
      year: a.year || '',
      style: a.style || '',
      framedStatus: a.framed_status || '',
      price: a.price || '',
      priceOnRequest: !!a.price_on_request || !(a.price || '').trim(),
    });
    setEditError('');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditError('');
    const res = await postJson('/api/my-artworks/update', { artworkId: editing.id, ...form });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setEditError(data.error || 'Could not save. Please try again.'); return; }
    setEditing(null);
    reloadArtworks();
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.push('/artist-login');
  }

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (error) {
    return (
      <main className="max-w-4xl mx-auto mt-16 px-6">
        <p className="text-red-600 mb-2">{error}</p>
        <p className="text-ink-soft text-sm">
          Not registered as an artist yet? <Link href="/join" className="underline text-blue-deep">Apply here</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <div className="flex justify-between items-start gap-4 mb-10 flex-wrap">
        <div>
          <h1 className="text-2xl mb-1">Welcome, {artist?.name}</h1>
          <p className="text-ink-soft text-sm">Manage your listed artwork and commissions.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/artist/profile" className="min-h-11 inline-flex items-center text-sm border border-line px-4 rounded-full hover:bg-sand">
            Edit Profile
          </Link>
          <Link href="/artist/password" className="min-h-11 inline-flex items-center text-sm border border-line px-4 rounded-full hover:bg-sand">
            Change Password
          </Link>
          <button onClick={logout} className="min-h-11 text-sm border border-line px-4 rounded-full hover:bg-sand">
            Log Out
          </button>
        </div>
      </div>

      <section className="mb-14">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg">My Artworks <span className="font-mono text-sm text-ink-soft font-normal">({artworks.length})</span></h2>
          <Link href="/submit-artwork" className="min-h-11 inline-flex items-center bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep">
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
                <p className="text-xs text-ink-soft mb-2">{a.listing_type === 'original' ? 'Original' : 'Print'} · {priceText(a)}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[a.status] || ''}`}>
                  {STATUS_LABEL[a.status] || a.status}
                </span>
                {a.status === 'hidden' && (
                  <p className="text-xs text-ink-soft mt-2">Taken offline by ARTERRA. Contact the team to change it.</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {a.status !== 'hidden' && (
                    <button onClick={() => openEdit(a)} className={btnLight}>
                      {a.status === 'rejected' ? 'Edit and resubmit' : 'Edit'}
                    </button>
                  )}
                  {(a.status === 'approved' || a.status === 'sold') && (
                    <button onClick={() => toggleSold(a)} className={btnLight}>
                      {a.status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}
                    </button>
                  )}
                  <button onClick={() => removeArtwork(a)} className={btnDanger}>Remove</button>
                </div>
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

                {c.reference_urls && c.reference_urls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-ink-soft mb-2">Reference images</p>
                    <div className="flex gap-2 flex-wrap">
                      {c.reference_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer">
                          <img src={u} alt={`Reference ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-line" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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
                    className="flex-1 min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
                  <button onClick={() => sendMessage(c.id)}
                    className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep">
                    Send
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
            <form role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={saveEdit}
              className="relative bg-card rounded-xl p-7 w-full max-w-lg shadow-lg space-y-3"
              onClick={e => e.stopPropagation()}>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)}
                className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center text-xl text-ink-soft hover:text-ink">
                ×
              </button>
              <h2 id="edit-title" className="text-xl pr-8">
                {editing.status === 'rejected' ? 'Edit and resubmit' : 'Edit piece'}
              </h2>

              <input required autoFocus placeholder="Title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} />

              <div className="flex gap-3">
                {['original', 'print'].map(t => (
                  <label key={t} className={`flex-1 min-h-11 flex items-center justify-center border rounded-lg px-4 text-sm font-medium cursor-pointer ${form.listingType === t ? 'border-blue bg-blue/10 text-blue-deep' : 'border-line text-ink-soft'}`}>
                    <input type="radio" name="editListingType" value={t} checked={form.listingType === t}
                      onChange={e => setForm({ ...form, listingType: e.target.value })} className="sr-only" />
                    {t === 'original' ? 'Original' : 'Print'}
                  </label>
                ))}
              </div>

              <textarea placeholder="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />

              <div className="flex gap-3">
                <input placeholder="Medium" value={form.medium}
                  onChange={e => setForm({ ...form, medium: e.target.value })} className={inputClass} />
                <input placeholder="Size" value={form.size}
                  onChange={e => setForm({ ...form, size: e.target.value })} className={inputClass} />
              </div>

              <div className="flex gap-3">
                <input placeholder="Year" value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })} className={inputClass} />
                <input placeholder="Style" value={form.style}
                  onChange={e => setForm({ ...form, style: e.target.value })} className={inputClass} />
              </div>

              <select value={form.framedStatus}
                onChange={e => setForm({ ...form, framedStatus: e.target.value })} className={inputClass}>
                <option value="">Framing status</option>
                <option value="unframed">Unframed</option>
                <option value="stretched">Stretched Canvas</option>
                <option value="framed">Framed, Ready to Hang</option>
              </select>

              <input placeholder="Price, e.g. $450" value={form.price}
                required={!form.priceOnRequest} disabled={form.priceOnRequest}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className={inputClass + (form.priceOnRequest ? ' opacity-50' : '')} />
              <label className="flex items-center gap-2 text-sm text-ink-soft min-h-11">
                <input type="checkbox" checked={form.priceOnRequest}
                  onChange={e => setForm({ ...form, priceOnRequest: e.target.checked })} />
                Price on request
              </label>

              <p className="text-xs text-ink-soft">
                To change the photo, remove this piece and submit it again. New photos are reviewed before they go live.
              </p>

              {editError && <p className="text-red-600 text-sm">{editError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 min-h-11 bg-ink text-cream px-4 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
                  {saving ? 'Saving…' : editing.status === 'rejected' ? 'Save and resubmit' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditing(null)}
                  className="min-h-11 border border-line bg-card px-4 rounded-lg hover:bg-sand">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}