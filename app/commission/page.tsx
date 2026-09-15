'use client';

import { useState } from 'react';

const MEDIUMS = ['Painting','Drawing','Portrait','Sculpture','Photography','Textile / Fiber art','Ceramics','Mixed media','Not sure yet'];
const STYLES = ['Abstract','Contemporary realism','Landscape','Still life','Other','Not sure yet'];

export default function CommissionPage() {
  const [form, setForm] = useState({
    buyerName: '', buyerContact: '', description: '',
    medium: MEDIUMS[0], style: STYLES[0], size: '', budget: '',
    deadline: '', location: '', notes: ''
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong.'); return; }
    setStatus('done');
  }

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (status === 'done') {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <h1 className="text-2xl mb-1">Brief received.</h1>
        <p className="text-ink-soft mt-2">We&apos;ll follow up with a short-list of artists soon.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Start a commission</h1>
      <p className="text-ink-soft mb-6">Tell us what you&apos;re picturing.</p>

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

        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={status === 'saving'}
          className="bg-ink text-cream px-6 py-2.5 rounded-lg font-medium hover:bg-blue-deep disabled:opacity-50">
          {status === 'saving' ? 'Sending…' : 'Send my brief'}
        </button>
      </form>
    </main>
  );
}