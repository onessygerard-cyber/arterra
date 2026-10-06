'use client';

import { useState } from 'react';

type Artist = { id: string; name: string; status: string };

export default function SubmitArtworkPage() {
  const [contact, setContact] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'checking' | 'found' | 'not-verified' | 'not-found'>('idle');
  const [artist, setArtist] = useState<Artist | null>(null);

  const [form, setForm] = useState({ title: '', description: '', listingType: 'original', medium: '', size: '', price: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  async function lookupArtist(e: React.FormEvent) {
    e.preventDefault();
    setLookupStatus('checking');
    const res = await fetch('/api/find-artist?contact=' + encodeURIComponent(contact.trim()));
    const data = await res.json();
    if (data.found) { setArtist(data.artist); setLookupStatus('found'); }
    else if (data.notVerified) { setLookupStatus('not-verified'); }
    else { setLookupStatus('not-found'); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile) { setErrorMsg('Please choose a photo of the piece.'); return; }
    if (!artist) return;
    setStatus('saving');
    setErrorMsg('');

    const uploadForm = new FormData();
    uploadForm.append('file', imageFile);
    const uploadRes = await fetch('/api/upload-image', { method: 'POST', body: uploadForm });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) { setStatus('error'); setErrorMsg(uploadData.error || 'Image upload failed.'); return; }

    const res = await fetch('/api/artworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId: artist.id, ...form, imageUrl: uploadData.imageUrl })
    });
    const data = await res.json();
    if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong.'); return; }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <h1 className="text-2xl mb-1">Submitted for review.</h1>
        <p className="text-ink-soft mt-2">We&apos;ll check it over and add it to your profile once approved.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Submit Artwork</h1>
            <p className="text-ink-soft mb-6">List an existing piece, original or print, on your profile.</p>
     
      {lookupStatus !== 'found' && (
        <form onSubmit={lookupArtist} className="space-y-3 bg-card border border-line rounded-xl p-7 shadow-sm">
          <label className="text-sm font-medium">Confirm it&apos;s you</label>
          <input required placeholder="Email or WhatsApp you registered with" value={contact}
            onChange={e => setContact(e.target.value)} className={inputClass} />
          <button type="submit" disabled={lookupStatus === 'checking'}
            className="bg-ink text-cream px-5 py-2.5 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
            {lookupStatus === 'checking' ? 'Checking…' : 'Continue'}
          </button>
          {lookupStatus === 'not-found' && <p className="text-red-600 text-sm">We couldn&apos;t find that contact. Have you registered as an artist yet?</p>}
            {lookupStatus === 'not-verified' && <p className="text-red-600 text-sm">Your application is still under review. Check back once approved.</p>}
        </form>
      )}

      {lookupStatus === 'found' && artist && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
          <p className="text-sm text-ink-soft">Submitting as <span className="font-medium text-ink">{artist.name}</span></p>

          <input required placeholder="Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} />

          <div className="flex gap-3">
            {['original', 'print'].map(t => (
              <label key={t} className={`flex-1 border rounded-lg px-4 py-2.5 text-center cursor-pointer text-sm font-medium ${form.listingType === t ? 'border-blue bg-blue/10 text-blue-deep' : 'border-line text-ink-soft'}`}>
                <input type="radio" name="listingType" value={t} checked={form.listingType === t}
                  onChange={e => setForm({ ...form, listingType: e.target.value })} className="hidden" />
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

          <input placeholder="Price, e.g. $450" value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass} />

          <div>
            <label className="text-sm font-medium block mb-2">Photo</label>
            <input required type="file" accept="image/*" onChange={handleFileChange}
              className="w-full text-sm" />
            {previewUrl && <img src={previewUrl} alt="Preview" className="mt-3 rounded-lg max-h-48 object-cover" />}
          </div>

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <button type="submit" disabled={status === 'saving'}
            className="bg-ink text-cream px-6 py-2.5 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
            {status === 'saving' ? 'Uploading…' : 'Submit Artwork'}
          </button>
        </form>
      )}
    </main>
  );
}