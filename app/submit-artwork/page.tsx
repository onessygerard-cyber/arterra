'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { shrinkImage } from '@/lib/shrink-image';

const MAX_BYTES = 4 * 1024 * 1024;

export default function SubmitArtworkPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [artistName, setArtistName] = useState('');
  const [checking, setChecking] = useState(true);
  const [problem, setProblem] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', listingType: 'original', medium: '', size: '',
    price: '', priceOnRequest: false, year: '', framedStatus: '', style: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.replace('/artist-login'); return; }
      const tok = data.session.access_token;
      const res = await fetch('/api/my-artworks', { headers: { Authorization: `Bearer ${tok}` } });
      const body = await res.json();
      if (!res.ok) {
        setProblem(body.error || 'We could not find your artist profile.');
        setChecking(false);
        return;
      }
      setToken(tok);
      setArtistName(body.artist.name);
      setChecking(false);
    }
    init();
  }, [router]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMsg('');
    const original = e.target.files?.[0] || null;
    const file = original ? await shrinkImage(original) : null;
    if (file && file.size > MAX_BYTES) {
      setErrorMsg('That image is over 4 MB. Please choose a smaller one.');
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile) { setErrorMsg('Please choose a photo of the piece.'); return; }
    setStatus('saving');
    setErrorMsg('');

    const upload = new FormData();
    upload.append('file', imageFile);
    const upRes = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: upload,
    });
    const upData = await upRes.json().catch(() => ({}));
    if (!upRes.ok) {
      setStatus('idle');
      setErrorMsg(upRes.status === 401 ? 'Your session expired. Please log in again.' : upData.error || 'The image failed to upload.');
      return;
    }

    const res = await fetch('/api/artworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, imageUrl: upData.imageUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus('idle');
      setErrorMsg(data.error || 'Something went wrong. Please try again.');
      return;
    }
    setStatus('done');
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

  if (status === 'done') {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <h1 className="text-2xl mb-1">Submitted for review.</h1>
        <p className="text-ink-soft mt-2 mb-6">We will check it over and add it to your profile once approved.</p>
        <Link href="/artist/dashboard"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Submit Artwork</h1>
      <p className="text-ink-soft mb-6">List an existing piece, original or print, on your profile.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
        <p className="text-sm text-ink-soft">Submitting as <span className="font-medium text-ink">{artistName}</span></p>

        <input required placeholder="Title" value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} />

        <div className="flex gap-3">
          {['original', 'print'].map(t => (
            <label key={t} className={`flex-1 min-h-11 flex items-center justify-center border rounded-lg px-4 text-center cursor-pointer text-sm font-medium ${form.listingType === t ? 'border-blue bg-blue/10 text-blue-deep' : 'border-line text-ink-soft'}`}>
              <input type="radio" name="listingType" value={t} checked={form.listingType === t}
                onChange={e => setForm({ ...form, listingType: e.target.value })} className="sr-only" />
              {t === 'original' ? 'Original' : 'Print'}
            </label>
          ))}
        </div>

        <textarea placeholder="Description" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />

        <div className="flex gap-3">
          <input placeholder="Medium, e.g. Oil on canvas" value={form.medium}
            onChange={e => setForm({ ...form, medium: e.target.value })} className={inputClass} />
          <input placeholder="Size, e.g. 60 × 80 cm" value={form.size}
            onChange={e => setForm({ ...form, size: e.target.value })} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <input placeholder="Year, e.g. 2025" value={form.year}
            onChange={e => setForm({ ...form, year: e.target.value })} className={inputClass} />
          <input placeholder="Style, e.g. Abstract" value={form.style}
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

        <div>
          <label className="text-sm font-medium block mb-2">Photo (JPG, PNG or WebP; large photos are resized for you)</label>
          <input required type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange} className="w-full text-sm" />
          {previewUrl && <img src={previewUrl} alt="Preview" className="mt-3 rounded-lg max-h-48 object-cover" />}
        </div>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={status === 'saving'}
          className="min-h-11 bg-ink text-cream px-6 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
          {status === 'saving' ? 'Uploading…' : 'Submit Artwork'}
        </button>
      </form>
    </main>
  );
}