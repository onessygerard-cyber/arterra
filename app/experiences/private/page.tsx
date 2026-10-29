'use client';

import { useState } from 'react';
import Link from 'next/link';

const input =
  'w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

export default function PrivateEventPage() {
  const [form, setForm] = useState({
    name: '', contact: '', organisation: '', group_size: '', preferred_date: '',
    location: '', budget: '', preferred_artist: '', description: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/event-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Your enquiry could not be sent.'); return; }
      setDone(true);
    } catch {
      setError('Your enquiry could not be sent. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="max-w-lg mx-auto mt-16 px-6">
        <h1 className="text-2xl mb-2">Thank you.</h1>
        <p className="text-ink-soft mb-6">
          ARTERRA will get back to you using the contact details you gave. This is an enquiry, not a booking. A
          private event is confirmed only once the date, place, price and terms are agreed in writing.
        </p>
        <Link href="/experiences"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Back to experiences
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto mt-16 px-6 pb-24">
      <Link href="/experiences" className="text-sm underline text-blue-deep">All experiences</Link>
      <h1 className="text-2xl mt-4 mb-2">Plan a private event</h1>
      <p className="text-ink-soft mb-6">
        A workshop for your team, a group or a celebration, led by one of our artists. Tell us what you have in mind.
      </p>

      <form onSubmit={submit} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
        <input required aria-label="Your name" placeholder="Your name" value={form.name} onChange={set('name')} maxLength={120} className={input} />
        <input required aria-label="Email or WhatsApp" placeholder="Email or WhatsApp" value={form.contact} onChange={set('contact')} maxLength={200} className={input} />
        <input aria-label="Organisation" placeholder="Organisation (optional)" value={form.organisation} onChange={set('organisation')} maxLength={160} className={input} />
        <div className="grid grid-cols-2 gap-3">
          <input aria-label="Group size" type="number" min={1} max={1000} placeholder="Group size" value={form.group_size} onChange={set('group_size')} className={input} />
          <input aria-label="Preferred date or period" placeholder="Preferred date" value={form.preferred_date} onChange={set('preferred_date')} maxLength={120} className={input} />
        </div>
        <input aria-label="City or venue" placeholder="City or venue" value={form.location} onChange={set('location')} maxLength={160} className={input} />
        <input aria-label="Budget" placeholder="Budget (optional)" value={form.budget} onChange={set('budget')} maxLength={120} className={input} />
        <input aria-label="Preferred artist" placeholder="An artist you would like (optional)" value={form.preferred_artist} onChange={set('preferred_artist')} maxLength={160} className={input} />
        <textarea required aria-label="What you have in mind" rows={5} placeholder="What do you have in mind?" value={form.description} onChange={set('description')} maxLength={3000} className={input} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={busy}
          className="min-h-11 bg-brand text-cream px-6 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
          {busy ? 'Sending…' : 'Send enquiry'}
        </button>
      </form>
    </main>
  );
}