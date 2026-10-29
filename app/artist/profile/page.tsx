'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Avatar from '@/components/Avatar';
import { shrinkImage } from '@/lib/shrink-image';

const MEDIUMS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture',
  'Photography', 'Textile / Fiber art', 'Ceramics', 'Mixed media',
];
const MAX_BYTES = 4 * 1024 * 1024;

export default function EditProfilePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [problem, setProblem] = useState('');
  const [artistId, setArtistId] = useState('');
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    contact: '', location: '', shipsTo: '', priceRange: '', turnaround: '', styles: '', bio: '',
  });
  const [mediums, setMediums] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');

  async function authFetch(url: string, init: RequestInit = {}) {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
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
        setProblem(body.error || 'We could not find your artist profile.');
        setChecking(false);
        return;
      }
      const a = body.artist;
      setArtistId(a.id);
      setName(a.name);
      setPhotoUrl(a.photo_url || null);
      setForm({
        contact: a.contact || '',
        location: a.location || '',
        shipsTo: a.ships_to || '',
        priceRange: a.price_range || '',
        turnaround: a.turnaround || '',
        styles: (a.styles || []).join(', '),
        bio: a.bio || '',
      });
      setMediums(a.mediums || []);
      setChecking(false);
    }
    init();
  }, [router]);

  function toggleMedium(m: string) {
    setMediums(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]));
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    setPhotoBusy(true);
    const file = await shrinkImage(original, 1000);
    setPhotoMsg('');
    if (file.size > MAX_BYTES) { setPhotoBusy(false); setPhotoMsg('That image is still over 4 MB. Please choose a different one.'); return; }
    setPhotoBusy(true);
    const upload = new FormData();
    upload.append('file', file);
    const res = await authFetch('/api/my-profile/photo', { method: 'POST', body: upload });
    const data = await res.json().catch(() => ({}));
    setPhotoBusy(false);
    if (!res.ok) { setPhotoMsg(data.error || 'The photo could not be uploaded.'); return; }
    setPhotoUrl(data.photoUrl);
    setPhotoMsg('Photo updated.');
  }

  async function removePhoto() {
    setPhotoMsg('');
    setPhotoBusy(true);
    const res = await authFetch('/api/my-profile/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remove: true }),
    });
    const data = await res.json().catch(() => ({}));
    setPhotoBusy(false);
    if (!res.ok) { setPhotoMsg(data.error || 'The photo could not be removed.'); return; }
    setPhotoUrl(null);
    setPhotoMsg('Photo removed.');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (mediums.length === 0) { setError('Choose at least one art type.'); return; }
    setSaving(true);
    const res = await authFetch('/api/my-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        mediums,
        styles: form.styles.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Your profile could not be saved.'); return; }
    setMessage('Saved. Your public profile is updated.');
  }

  const inputClass = "w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) return <main className="max-w-lg mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  if (problem) {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <p className="text-ink-soft mb-4">{problem}</p>
        <Link href="/artist-login"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Artist Login
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-20">
      <Link href="/artist/dashboard" className="text-sm underline text-blue-deep">Back to dashboard</Link>
      <h1 className="text-2xl mt-4 mb-6">Edit Profile</h1>

      <div className="bg-card border border-line rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} src={photoUrl} size={80} />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-ink-soft mb-2">To change your name, contact the ARTERRA team.</p>
            <div className="flex gap-2 flex-wrap">
              <label className="inline-flex items-center min-h-11 px-4 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand cursor-pointer">
                {photoBusy ? 'Working…' : photoUrl ? 'Change photo' : 'Add photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto}
                  disabled={photoBusy} className="sr-only" />
              </label>
              {photoUrl && (
                <button type="button" onClick={removePhoto} disabled={photoBusy}
                  className="min-h-11 px-3 text-sm text-ink-soft underline hover:text-ink">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        {photoMsg && <p className="text-sm text-ink-soft mt-3">{photoMsg}</p>}
        <p className="text-xs text-ink-soft mt-3">JPG, PNG or WebP, under 4 MB. A square photo works best.</p>
      </div>

      <form onSubmit={save} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
        <div>
          <p className="text-sm font-medium mb-2">Art type (choose all that apply)</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {MEDIUMS.map(m => (
              <label key={m} className="flex items-center gap-1.5 text-sm text-ink-soft min-h-11">
                <input type="checkbox" checked={mediums.includes(m)} onChange={() => toggleMedium(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>

        <input placeholder="Style, e.g. Abstract, Realism" value={form.styles}
          onChange={e => setForm({ ...form, styles: e.target.value })} className={inputClass} />
        <input required placeholder="Location (city, country)" value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} />
        <input placeholder="Ships to, e.g. Worldwide" value={form.shipsTo}
          onChange={e => setForm({ ...form, shipsTo: e.target.value })} className={inputClass} />
        <input required placeholder="Typical price range" value={form.priceRange}
          onChange={e => setForm({ ...form, priceRange: e.target.value })} className={inputClass} />
        <input required placeholder="Typical turnaround" value={form.turnaround}
          onChange={e => setForm({ ...form, turnaround: e.target.value })} className={inputClass} />
        <textarea required placeholder="About your work" value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })} className={inputClass} rows={5} />
        <div>
          <input required placeholder="Email or WhatsApp" value={form.contact}
            onChange={e => setForm({ ...form, contact: e.target.value })} className={inputClass} />
          <p className="text-xs text-ink-soft mt-1">Private. Only the ARTERRA team sees this.</p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-sm text-ink-soft">{message}</p>}

        <div className="flex items-center gap-4 flex-wrap">
          <button type="submit" disabled={saving}
            className="min-h-11 bg-ink text-cream px-6 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/artist/${artistId}`} className="text-sm underline text-blue-deep">View my public profile</Link>
        </div>
      </form>
    </main>
  );
}