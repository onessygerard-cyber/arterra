'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Ticket, { type TicketTone } from '@/components/Ticket';
import { FORMAT_LABEL, formatDate, formatDuration, formatTime } from '@/lib/experiences';

type Data = {
  booking: { name: string; seats: number; status: string; admin_note: string };
  experience: {
    id: string; title: string; status: string; finished: boolean; event_date: string;
    start_time: string; duration_minutes: number; location: string; format: string;
    price: string; host: string | null; private_details: string | null;
  };
};

const STATUS_TEXT: Record<string, { title: string; body: string }> = {
  requested: {
    title: 'Waiting for ARTERRA to confirm',
    body: 'Your place is not reserved yet. ARTERRA will confirm it and tell you how to pay. Check this page again later.',
  },
  confirmed: { title: 'Your place is confirmed', body: 'We look forward to seeing you.' },
  waitlist: {
    title: 'You are on the waiting list',
    body: 'If a place opens up, ARTERRA will move you across and tell you. This page will show it.',
  },
  declined: {
    title: 'This request could not be accepted',
    body: 'Contact ARTERRA if you would like to talk it through.',
  },
  cancelled: { title: 'This reservation is cancelled', body: '' },
};

function BookingContent() {
  const token = useSearchParams().get('token') || '';
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/experience-bookings/track?token=' + token);
    if (!res.ok) { setNotFound(true); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function cancel() {
    if (!confirm('Cancel this reservation? If you have already paid, contact ARTERRA about any refund.')) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/experience-bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(body.error || 'It could not be cancelled.'); return; }
    await load();
  }

  if (loading) return <main className="max-w-2xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (notFound || !data) {
    return (
      <main className="max-w-2xl mx-auto mt-16 px-6">
        <p className="text-ink-soft">We couldn&apos;t find that reservation. Check the link and try again.</p>
      </main>
    );
  }

  const { booking, experience: e } = data;
  const text = STATUS_TEXT[booking.status] || STATUS_TEXT.requested;
  const cancelledExp = e.status === 'cancelled';
  const dead = cancelledExp || booking.status === 'declined' || booking.status === 'cancelled';
  const active = ['requested', 'confirmed', 'waitlist'].includes(booking.status) && !e.finished && !cancelledExp;

  const tone: TicketTone = dead ? 'void' : booking.status === 'confirmed' ? 'live' : 'pending';
  const stampText = cancelledExp
    ? 'Cancelled'
    : booking.status === 'declined'
      ? 'Declined'
      : booking.status === 'cancelled'
        ? 'Cancelled'
        : booking.status === 'confirmed'
          ? 'Confirmed'
          : booking.status === 'waitlist'
            ? 'Waiting list'
            : 'Awaiting confirmation';
  const stampClass = dead
    ? 'border-brand text-brand'
    : booking.status === 'confirmed'
      ? 'border-blue-deep text-blue-deep'
      : 'border-gold-deep text-gold-deep';

  return (
    <main className="max-w-2xl mx-auto mt-16 px-6 pb-24">
      <h1 className="text-2xl mb-6">Your reservation</h1>

      {!cancelledExp && e.finished && (
        <div className="border border-line bg-card rounded-xl p-5 mb-6 text-sm text-ink-soft">
          This experience has finished.
        </div>
      )}

      <div className="mb-6">
        <p className="font-display text-xl mb-1">{cancelledExp ? 'This experience has been cancelled' : text.title}</p>
        <p className="text-sm text-ink-soft">
          {cancelledExp ? 'Contact ARTERRA about any payment you have made.' : text.body}
        </p>
        {booking.admin_note && (
          <div className="mt-4 rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-medium text-ink-soft mb-1">Message from ARTERRA</p>
            <p className="text-sm whitespace-pre-line">{booking.admin_note}</p>
          </div>
        )}
      </div>

      <Ticket
        tone={tone}
        main={
          <>
            <p className="font-mono text-xs text-ink-soft mb-2">ARTERRA EXPERIENCE</p>
            <h2 className="font-display text-2xl leading-snug mb-5">{e.title}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
              <dt className="text-ink-soft">Date</dt><dd>{formatDate(e.event_date)}</dd>
              <dt className="text-ink-soft">Starts</dt><dd>{formatTime(e.start_time)} (local time)</dd>
              <dt className="text-ink-soft">Length</dt><dd>{formatDuration(e.duration_minutes)}</dd>
              <dt className="text-ink-soft">Where</dt><dd>{e.location}</dd>
              <dt className="text-ink-soft">Format</dt><dd>{FORMAT_LABEL[e.format]}</dd>
              {e.host && (<><dt className="text-ink-soft">Host</dt><dd>{e.host}</dd></>)}
            </dl>

            {booking.status === 'confirmed' && !cancelledExp && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-xs font-medium text-ink-soft mb-1">
                  {e.format === 'online' ? 'How to join' : 'Where to go'}
                </p>
                <p className="text-sm whitespace-pre-line">
                  {e.private_details || 'ARTERRA will send you the details closer to the day.'}
                </p>
              </div>
            )}
          </>
        }
        stub={
          <>
            <p className="font-mono text-xs text-ink-soft">ADMIT</p>
            <p className="font-display text-5xl leading-none mt-1">{booking.seats}</p>
            <p className="text-xs text-ink-soft mt-1">{booking.seats === 1 ? 'seat' : 'seats'}</p>
            <p className="mt-5 text-sm font-medium">{e.price}</p>
            <p className="mt-1 text-xs text-ink-soft break-words">Booked as {booking.name}</p>
            <span
              className={`mt-5 inline-block -rotate-3 rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${stampClass}`}
            >
              {stampText}
            </span>
          </>
        }
      />

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
      {active && (
        <button onClick={cancel} disabled={busy}
          className="mt-6 min-h-11 border border-red-300 text-red-800 bg-card px-5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
          {busy ? 'Cancelling…' : 'Cancel my reservation'}
        </button>
      )}

      <p className="text-xs text-ink-soft mt-8">
        Keep this link. It is the only way to check your reservation.{' '}
        <Link href="/experiences" className="underline text-blue-deep">See more experiences</Link>
      </p>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<main className="max-w-2xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>}>
      <BookingContent />
    </Suspense>
  );
}