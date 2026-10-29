'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  FORMAT_LABEL, SKILL_LABEL, STATUS_LABEL, formatDate, formatDuration, formatTime, todayIso,
  type ExperienceFields,
} from '@/lib/experiences';

type Row = ExperienceFields & {
  id: string;
  status: string;
  artists: { name: string; contact: string } | null;
};
type Booking = {
  id: string; experience_id: string; name: string; contact: string; seats: number; message: string;
  status: string; paid: boolean; admin_note: string; booking_token: string;
};
type Enquiry = {
  id: string; name: string; contact: string; organisation: string; group_size: number | null;
  preferred_date: string; location: string; budget: string; description: string;
  preferred_artist: string; status: string; created_at: string;
};

const BOOKING_LABEL: Record<string, string> = {
  requested: 'Requested', confirmed: 'Confirmed', waitlist: 'Waiting list',
  declined: 'Declined', cancelled: 'Cancelled',
};

const card = 'bg-card border border-line rounded-xl p-5 shadow-sm';
const btnDark = 'min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep';
const btnLight = 'min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand';
const btnDanger = 'min-h-11 border border-red-300 text-red-800 bg-card px-4 rounded-lg text-sm font-medium hover:bg-red-50';

function daysUntil(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayIso()}T00:00:00Z`)) / 86400000);
}

export default function StudioExperiencesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    const res = await authFetch('/api/studio-experiences');
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    const data = await res.json();
    setRows(data.experiences || []);
    setBookings(data.bookings || []);
    setEnquiries(data.enquiries || []);
  }, [authFetch, router]);

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.push('/studio/login'); return; }
      await load();
      setChecking(false);
    }
    init();
  }, [router, load]);

  async function post(url: string, payload: Record<string, unknown>) {
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Something went wrong.');
      return;
    }
    await load();
  }

  const act = (experienceId: string, action: string) =>
    post('/api/experiences/moderate', { experienceId, action });
  const book = (bookingId: string, action: string, note?: string) =>
    post('/api/experience-bookings/manage', { bookingId, action, note });

  function editNote(b: Booking) {
    const note = window.prompt('Message the attendee will see on their booking page (for example, how to pay):', b.admin_note);
    if (note !== null) book(b.id, 'note', note);
  }

  function copyLink(b: Booking) {
    navigator.clipboard.writeText(`${window.location.origin}/experiences/booking?token=${b.booking_token}`);
    alert('Booking link copied. Send it to the attendee.');
  }

  function copyContacts(list: Booking[]) {
    const lines = list.filter(b => b.status === 'confirmed').map(b => `${b.name}: ${b.contact}`);
    if (lines.length === 0) { alert('No confirmed attendees yet.'); return; }
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Copied the contact details of the confirmed attendees.');
  }

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  const groups: [string, string[]][] = [
    ['Waiting for review', ['pending']],
    ['Live', ['published']],
    ['Finished, cancelled or not accepted', ['completed', 'cancelled', 'rejected']],
  ];

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <a href="/studio" className="text-sm underline text-blue-deep">Back to Studio</a>
      <h1 className="text-2xl mt-4 mb-10">Experiences</h1>

      {groups.map(([title, statuses]) => {
        const list = rows.filter(r => statuses.includes(r.status));
        return (
          <section key={title} className="mb-14">
            <h2 className="text-lg mb-4">
              {title} <span className="font-mono text-sm text-ink-soft font-normal">({list.length})</span>
            </h2>
            {list.length === 0 && <p className="text-ink-soft text-sm">Nothing here.</p>}
            <div className="space-y-3">
              {list.map(r => {
                const mine = bookings.filter(b => b.experience_id === r.id);
                const taken = mine.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.seats, 0);
                const waiting = mine.filter(b => b.status === 'requested' || b.status === 'waitlist').length;
                const days = daysUntil(r.event_date);
                const short = r.status === 'published' && taken < r.min_attendees && days >= 0 && days <= 7;

                return (
                  <div key={r.id} className={card}>
                    <div className="flex gap-4">
                      {r.image_url && (
                        <img src={r.image_url} alt="" className="w-24 h-24 object-cover rounded-lg border border-line shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-3">
                          <p className="font-medium">{r.title}</p>
                          <span className="text-xs font-mono text-ink-soft whitespace-nowrap">{STATUS_LABEL[r.status]}</span>
                        </div>
                        <p className="text-sm text-ink-soft">
                          {r.artists?.name} · {formatDate(r.event_date)} · {formatTime(r.start_time)} · {formatDuration(r.duration_minutes)}
                        </p>
                        <p className="text-sm text-ink-soft">
                          {FORMAT_LABEL[r.format]} · {SKILL_LABEL[r.skill_level]} · {r.location} · {r.price}
                        </p>
                        <p className="text-sm mt-2 whitespace-pre-line">{r.description}</p>
                        {r.private_details && (
                          <p className="text-xs text-ink-soft mt-2 whitespace-pre-line">
                            <span className="font-medium">Private details:</span> {r.private_details}
                          </p>
                        )}
                        <p className="text-xs font-mono text-ink-soft/80 mt-2">{r.artists?.contact}</p>

                        {r.status !== 'pending' && r.status !== 'rejected' && (
                          <p className="text-sm mt-3">
                            Confirmed seats: <span className="font-medium">{taken} of {r.capacity}</span> (minimum {r.min_attendees})
                            {waiting > 0 && <span className="text-gold-deep font-medium"> · {waiting} waiting for you</span>}
                          </p>
                        )}
                        {short && (
                          <p className="mt-2 text-sm rounded-lg border border-gold-deep/40 bg-gold/20 text-ink px-3 py-2">
                            Below the minimum with {days === 0 ? 'the event today' : `${days} ${days === 1 ? 'day' : 'days'} to go`}:
                            {' '}{taken} of {r.min_attendees} confirmed. You decide whether it goes ahead.
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {r.status === 'pending' && (
                            <>
                              <button className={btnDark} onClick={() => act(r.id, 'publish')}>Approve and publish</button>
                              <button className={btnDanger} onClick={() => act(r.id, 'reject')}>Reject</button>
                            </>
                          )}
                          {r.status === 'published' && (
                            <>
                              <a href={`/experiences/${r.id}`} className={`${btnLight} inline-flex items-center`}>View public page</a>
                              <button className={btnLight} onClick={() => act(r.id, 'complete')}>Mark completed</button>
                              <button className={btnDanger}
                                onClick={() => { if (confirm('Cancel this experience? Tell the confirmed attendees yourself.')) act(r.id, 'cancel'); }}>
                                Cancel
                              </button>
                            </>
                          )}
                          {(r.status === 'rejected' || r.status === 'cancelled') && (
                            <button className={btnLight} onClick={() => act(r.id, 'restore')}>Restore to review</button>
                          )}
                          {mine.length > 0 && (
                            <button className={btnLight} onClick={() => copyContacts(mine)}>Copy confirmed contacts</button>
                          )}
                        </div>

                        {mine.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-line">
                            <p className="text-sm font-medium mb-3">
                              Reservations <span className="font-mono text-xs text-ink-soft font-normal">({mine.length})</span>
                            </p>
                            <div className="space-y-3">
                              {mine.map(b => (
                                <div key={b.id} className="rounded-lg border border-line p-3 bg-cream/50">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">
                                        {b.name} · {b.seats} {b.seats === 1 ? 'seat' : 'seats'}
                                      </p>
                                      <p className="text-xs font-mono text-ink-soft break-all">{b.contact}</p>
                                      {b.message && <p className="text-xs mt-1">&ldquo;{b.message}&rdquo;</p>}
                                      {b.admin_note && <p className="text-xs text-ink-soft mt-1">Note: {b.admin_note}</p>}
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-line whitespace-nowrap">
                                      {BOOKING_LABEL[b.status]}{b.paid ? ' · Paid' : ''}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {(b.status === 'requested' || b.status === 'waitlist') && (
                                      <button className={btnDark} onClick={() => book(b.id, 'confirm')}>Confirm</button>
                                    )}
                                    {b.status === 'requested' && (
                                      <button className={btnLight} onClick={() => book(b.id, 'waitlist')}>Waiting list</button>
                                    )}
                                    {(b.status === 'requested' || b.status === 'waitlist') && (
                                      <button className={btnDanger} onClick={() => book(b.id, 'decline')}>Decline</button>
                                    )}
                                    {b.status === 'confirmed' && (
                                      <button className={btnDanger}
                                        onClick={() => { if (confirm('Cancel this confirmed place?')) book(b.id, 'cancel'); }}>
                                        Cancel place
                                      </button>
                                    )}
                                    {b.status !== 'declined' && b.status !== 'cancelled' && (
                                      <button className={btnLight} onClick={() => book(b.id, b.paid ? 'unpaid' : 'paid')}>
                                        {b.paid ? 'Mark unpaid' : 'Mark paid'}
                                      </button>
                                    )}
                                    <button className={btnLight} onClick={() => editNote(b)}>Message</button>
                                    <button className={btnLight} onClick={() => copyLink(b)}>Copy booking link</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="text-lg mb-4">
          Private event enquiries <span className="font-mono text-sm text-ink-soft font-normal">({enquiries.length})</span>
        </h2>
        {enquiries.length === 0 && <p className="text-ink-soft text-sm">No enquiries yet.</p>}
        <div className="space-y-3">
          {enquiries.map(q => (
            <div key={q.id} className={card}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{q.name}{q.organisation ? `, ${q.organisation}` : ''}</p>
                  <p className="text-sm text-ink-soft">
                    {[
                      q.group_size ? `${q.group_size} people` : '',
                      q.preferred_date, q.location, q.budget,
                      q.preferred_artist ? `wants ${q.preferred_artist}` : '',
                    ].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-sm mt-2 whitespace-pre-line">{q.description}</p>
                  <p className="text-xs font-mono text-ink-soft/80 mt-2 break-all">{q.contact}</p>
                </div>
                <select aria-label="Status"
                  className="min-h-11 border border-line rounded-lg px-2.5 text-sm font-mono bg-cream"
                  value={q.status}
                  onChange={e => post('/api/event-enquiries/update-status', { enquiryId: q.id, status: e.target.value })}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}