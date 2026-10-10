'use client';

import { useState } from 'react';

const MEDIUMS = ['Painting','Drawing','Portrait','Sculpture','Photography','Textile / Fiber art','Ceramics','Mixed media','Not sure yet'];
const STYLES = ['Abstract','Contemporary realism','Landscape','Still life','Other','Not sure yet'];
const MAX_IMAGES = 4;
const MAX_BYTES = 4 * 1024 * 1024;

export default function CommissionPage() {
  const [form, setForm] = useState({
    buyerName: '', buyerContact: '', description: '',
    medium: MEDIUMS[0], style: STYLES[0], size: '', budget: '',
    deadline: '', location: '', notes: ''
  });
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [refError, setRefError] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [trackToken, setTrackToken] = useState('');

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setRefError('');
    const picked = Array.from(e.target.files || []);
    const tooBig = picked.find(f => f.size > MAX_BYTES);
    if (tooBig) {
      setRefError(`"${tooBig.name}" is over 4 MB. Please choose a smaller image.`);
      e.target.value = '';
      return;
    }
    const combined = [...refFiles, ...picked];
    if (combined.length > MAX_IMAGES) setRefError(`You can add up to ${MAX_IMAGES} images.`);
    setRefFiles(combined.slice(0, MAX_IMAGES));
    e.target.value = '';
  }

  function removeFile(index: number) {
    setRefFiles(refFiles.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const referenceImages: string[] = [];
    for (const file of refFiles) {
      const upload = new FormData();
      upload.append('file', file);
      const upRes = await fetch('/api/upload-reference', { method: 'POST', body: upload });
      const upData = await upRes.json().catch(() => ({}));
      if (!upRes.ok) {
        setStatus('error');
        setErrorMsg(upData.error || 'An image failed to upload. Please try again.');
        return;
      }
      referenceImages.push(upData.path);
    }

    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, referenceImages })
    });
    const data = await res.json();
    if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong.'); return; }
    setTrackToken(data.brief.track_token);
    setStatus('done');
  }

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (status === 'done') {
    const trackUrl = `/track?token=${trackToken}`;
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <h1 className="text-2xl mb-1">Brief received.</h1>
        <p className="text-ink-soft mt-2 mb-6">We&apos;ll follow up with a short-list of artists soon.</p>
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium mb-2">Bookmark this link to track your request:</p>
          <a href={trackUrl} className="text-sm text-blue-deep underline break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}{trackUrl}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Request a Commission</h1>
      <p className="text-ink-soft mb-6">Tell us what you&apos;re picturing.</p>

      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          ['01', 'Tell us what you want', 'Add your idea, budget, deadline and references.'],
          ['02', 'We match you', 'A verified artist is matched, with a quote and timeline.'],
          ['03', 'Follow along', 'Track progress and message your artist.'],
        ].map(([num, title, body]) => (
          <li key={num} className="border-t-2 border-line pt-3">
            <span className="font-mono text-xs text-gold-deep block">{num}</span>
            <span className="text-sm font-medium block mt-1 mb-1">{title}</span>
            <span className="text-xs text-ink-soft block">{body}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
        <input required placeholder="Your name" value={form.buyerName}
          onChange={e => setForm({ ...form, buyerName: e.target.value })}
          className={inputClass} />

        <input required placeholder="Email or WhatsApp" value={form.buyerContact}
          onChange={e => setForm({ ...form, buyerContact: e.target.value })}
          className={inputClass} />

        <textarea required placeholder="What are you picturing?" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className={inputClass} rows={3} />

        <div className="flex gap-3">
          <select value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })}
            className={inputClass + " w-1/2"}>
            {MEDIUMS.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}
            className={inputClass + " w-1/2"}>
            {STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <input placeholder="Approximate size, e.g. 100 × 80 cm" value={form.size}
          onChange={e => setForm({ ...form, size: e.target.value })}
          className={inputClass} />

        <input placeholder="Budget, e.g. $400–700" value={form.budget}
          onChange={e => setForm({ ...form, budget: e.target.value })}
          className={inputClass} />

        <input type="date" value={form.deadline}
          onChange={e => setForm({ ...form, deadline: e.target.value })}
          className={inputClass} />

        <input placeholder="Delivery location (city, country)" value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          className={inputClass} />

        <textarea placeholder="Anything else? Colors, mood, or references (optional)" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          className={inputClass} rows={2} />

        <div>
          <label className="text-sm font-medium block mb-1">
            Reference images <span className="text-ink-soft font-normal">(optional, up to 4)</span>
          </label>
          <p className="text-xs text-ink-soft mb-2">
            Photos, sketches, or inspiration. Only the ARTERRA team and your matched artist will see these.
          </p>
          <input type="file" accept="image/*" multiple onChange={handleFiles}
            disabled={refFiles.length >= MAX_IMAGES} className="w-full text-sm" />
          {refError && <p className="text-red-600 text-sm mt-2">{refError}</p>}
          {refFiles.length > 0 && (
            <ul className="mt-3 space-y-1">
              {refFiles.map((f, i) => (
                <li key={i} className="flex justify-between items-center text-sm bg-sand/60 rounded-lg px-3 py-1.5">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-ink-soft hover:text-ink ml-3">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={status === 'saving'}
          className="bg-ink text-cream px-6 py-2.5 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
          {status === 'saving' ? 'Sending…' : 'Submit Request'}
        </button>
      </form>
    </main>
  );
}