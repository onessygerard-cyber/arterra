'use client';

import { useState } from 'react';

const MEDIUM_OPTIONS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture',
  'Photography', 'Textile / Fiber art', 'Ceramics', 'Mixed media'
];

export default function JoinPage() {
  const [form, setForm] = useState({
    name: '', contact: '', styles: '', location: '',
    shipsTo: '', priceRange: '', turnaround: '', bio: '', portfolio: ''
  });
  const [mediums, setMediums] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function toggleMedium(m: string) {
    setMediums(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mediums.length === 0) { setErrorMsg('Choose at least one art type.'); return; }
    setStatus('saving');
    setErrorMsg('');

    const res = await fetch('/api/artists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        mediums,
        styles: form.styles.split(',').map(s => s.trim()).filter(Boolean)
      })
    });
    const data = await res.json();
    if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong.'); return; }
    setStatus('done');
  }

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (status === 'done') {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
          <h1 className="text-2xl mb-1">Thanks, your application has been received.</h1>
        <p className="text-ink-soft mt-2">We&apos;ll review your work and follow up.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Join as an artist</h1>
      <p className="text-ink-soft mb-6">We review every application by hand.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
        <input required placeholder="Your name" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className={inputClass} />

        <input required placeholder="Email or WhatsApp" value={form.contact}
          onChange={e => setForm({ ...form, contact: e.target.value })}
          className={inputClass} />

        <div>
          <p className="text-sm font-medium mb-2">Art type (choose all that apply)</p>
          <div className="flex flex-wrap gap-3">
            {MEDIUM_OPTIONS.map(m => (
              <label key={m} className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input type="checkbox" checked={mediums.includes(m)} onChange={() => toggleMedium(m)} />
                {m}
              </label>
            ))}
          </div>
        </div>

        <input placeholder="Style, e.g. Abstract, Realism" value={form.styles}
          onChange={e => setForm({ ...form, styles: e.target.value })}
          className={inputClass} />

        <input required placeholder="Location (city, country)" value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          className={inputClass} />

        <input placeholder="Ships to (optional, e.g. Worldwide)" value={form.shipsTo}
          onChange={e => setForm({ ...form, shipsTo: e.target.value })}
          className={inputClass} />

        <input required placeholder="Typical price range, e.g. $200–800" value={form.priceRange}
          onChange={e => setForm({ ...form, priceRange: e.target.value })}
          className={inputClass} />

        <input required placeholder="Typical turnaround, e.g. 3–4 weeks" value={form.turnaround}
          onChange={e => setForm({ ...form, turnaround: e.target.value })}
          className={inputClass} />

        <textarea required placeholder="A little about your work" value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          className={inputClass} rows={3} />

        <textarea required placeholder="Portfolio links or description" value={form.portfolio}
          onChange={e => setForm({ ...form, portfolio: e.target.value })}
          className={inputClass} rows={3} />

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={status === 'saving'}
          className="bg-ink text-cream px-6 py-2.5 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
          {status === 'saving' ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </main>
  );
}