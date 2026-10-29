'use client';

import { useState } from 'react';
import Link from 'next/link';

const input =
  'w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

export default function ReservePanel({
  experienceId,
  state,
  seatsLeft,
}: {
  experienceId: string;
  state: 'open' | 'finished' | 'cancelled';
  seatsLeft: number;
}) {
  const [form, setForm] = useState({ name: '', contact: '', seats: '1', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ status: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (state === 'cancelled') {
    return <p className="text-sm text-ink-soft">This experience has been cancelled.</p>;
  }
  if (state === 'finished') {
    return <p className="text-sm text-ink-soft">This experience has finished.</p>;
  }

  const full = seatsLeft <= 0;
  const maxSeats = Math.max(1, Math.min(10, full ? 10 : seatsLeft));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/experience-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceId, ...form, seats: Number(form.seats) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Your request could not be sent.'); return; }
      setResult({ status: data.status, token: data.token });
    } catch {
      setError('Your request could not be sent. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const link = `${window.location.origin}/experiences/booking?token=${result.token}`;
    return (
      <div className="border border-line rounded-xl p-5 bg-card shadow-sm">
        <p className="font-display text-lg mb-1">
          {result.status === 'waitlist' ? 'You are on the waiting list.' : 'Request received.'}
        </p>
        <p className="text-sm text-ink-soft mb-4">
          This is not a confirmed place yet. ARTERRA will confirm it and tell you how to pay.
        </p>
        <p className="text-sm font-medium mb-1">Save your private link</p>
        <p className="text-xs text-ink-soft mb-2">It is the only way to check your reservation.</p>
        <Link href={`/experiences/booking?token=${result.token}`} className="text-sm underline text-blue-deep break-all">
          {link}
        </Link>
        <div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-3 min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand"
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-line rounded-xl p-5 bg-card shadow-sm space-y-3">
      <p className="font-display text-lg">{full ? 'Fully booked' : 'Reserve a place'}</p>
      <p className="text-xs text-ink-soft">
        {full
          ? 'Join the waiting list and ARTERRA will let you know if a place opens up.'
          : 'Asking for a place does not take any payment. ARTERRA confirms your place and arranges payment with you.'}
      </p>
      <input required aria-label="Your name" placeholder="Your name" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })} maxLength={120} className={input} />
      <input required aria-label="Email or WhatsApp" placeholder="Email or WhatsApp" value={form.contact}
        onChange={e => setForm({ ...form, contact: e.target.value })} maxLength={200} className={input} />
      <select aria-label="Number of seats" value={form.seats}
        onChange={e => setForm({ ...form, seats: e.target.value })} className={input}>
        {Array.from({ length: maxSeats }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>
        ))}
      </select>
      <textarea aria-label="Message" rows={2} placeholder="Anything we should know? (optional)" value={form.message}
        onChange={e => setForm({ ...form, message: e.target.value })} maxLength={1000} className={input} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full min-h-11 bg-brand text-cream px-5 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
        {busy ? 'Sending…' : full ? 'Join the waiting list' : 'Request a place'}
      </button>
    </form>
  );
}