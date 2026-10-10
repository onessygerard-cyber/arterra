'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const STAGES = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];
const STEP_LABELS: Record<string, string> = {
  proposed: 'Matched and quoted',
  deposit_paid: 'Deposit paid',
  in_progress: 'In progress',
  review: 'Final review',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

type Message = { id: string; from_label: string; text: string; created_at: string };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  artists: { name: string } | null;
  commission_messages: Message[];
};
type Brief = { id: string; buyer_name: string; description: string; status: string; reference_urls?: string[] };

function Stepper({ status }: { status: string }) {
  const current = Math.max(0, STAGES.indexOf(status));
  const allDone = status === 'delivered';
  return (
    <ol className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-4 mb-5">
      {STAGES.map((s, i) => {
        const done = allDone || i < current;
        const isCurrent = !allDone && i === current;
        return (
          <li key={s} aria-current={isCurrent ? 'step' : undefined}
            className={`border-t-4 pt-2 ${done ? 'border-gold' : isCurrent ? 'border-ink' : 'border-line'}`}>
            <span className="font-mono text-[11px] text-ink-soft block">0{i + 1}</span>
            <span className={`text-xs leading-snug block ${isCurrent ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-soft'}`}>
              {STEP_LABELS[s]}
            </span>
            <span className="sr-only">{done ? 'Completed' : isCurrent ? 'Current step' : 'Not started yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}

function TrackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [brief, setBrief] = useState<Brief | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) { setNotFound(true); setLoading(false); return; }
      const res = await fetch('/api/track?token=' + token);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setBrief(data.brief);
      setCommissions(data.commissions);
      setLoading(false);
    }
    load();
  }, [token]);

  async function sendMessage(commissionId: string) {
    const text = draft[commissionId]?.trim();
    if (!text || !brief) return;
    setSendError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, from: brief.buyer_name, text })
      });
      if (!res.ok) { setSendError('Your message could not be sent. Please try again.'); return; }
      setDraft({ ...draft, [commissionId]: '' });
      const refreshed = await fetch('/api/track?token=' + token);
      if (refreshed.ok) {
        const data = await refreshed.json();
        setCommissions(data.commissions);
      }
    } catch {
      setSendError('Your message could not be sent. Check your connection and try again.');
    }
  }

  if (loading) return <main className="max-w-2xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (notFound || !brief) {
    return (
      <main className="max-w-2xl mx-auto mt-16 px-6">
        <p className="text-ink-soft">We couldn&apos;t find that request. Check the link and try again.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Your Request</h1>
      <div className="mb-8">
        <p className="text-ink-soft mb-3">{brief.description}</p>
        {brief.reference_urls && brief.reference_urls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {brief.reference_urls.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt={`Reference ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-line" />
              </a>
            ))}
          </div>
        )}
      </div>

      {commissions.length === 0 && (
        <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
          <ol className="grid grid-cols-2 gap-x-3 mb-4">
            <li className="border-t-4 border-gold pt-2">
              <span className="font-mono text-[11px] text-ink-soft block">01</span>
              <span className="text-xs text-ink block">Request received</span>
              <span className="sr-only">Completed</span>
            </li>
            <li aria-current="step" className="border-t-4 border-ink pt-2">
              <span className="font-mono text-[11px] text-ink-soft block">02</span>
              <span className="text-xs font-semibold text-ink block">Matching with an artist</span>
              <span className="sr-only">Current step</span>
            </li>
          </ol>
          <p className="text-sm text-ink-soft">
            We&apos;re matching you with the right artist. Bookmark this page and check back for updates.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {commissions.map(c => {
          const messages = (c.commission_messages || []).slice().sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return (
            <div key={c.id} className="bg-card border border-line rounded-xl p-6 shadow-sm">
              <p className="font-medium">{c.artists?.name || 'Artist'}</p>
              <p className="text-sm text-ink-soft mb-4">{c.price} · {c.timeline}</p>

              <Stepper status={c.status} />

              <div className="border-t border-line pt-3 space-y-2 max-h-40 overflow-y-auto mb-3">
                {messages.length === 0 && <p className="text-sm text-ink-soft/70">No messages yet.</p>}
                {messages.map(m => (
                  <div key={m.id} className="text-sm bg-sand/60 rounded-lg px-3 py-2">
                    <span className="font-semibold text-xs block text-blue-deep">{m.from_label}</span>
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input placeholder="Send an update or question…"
                  value={draft[c.id] || ''}
                  onChange={e => setDraft({ ...draft, [c.id]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(c.id)}
                  className="flex-1 min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
                <button onClick={() => sendMessage(c.id)}
                  className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-blue-deep">
                  Send
                </button>
              </div>
              {sendError && <p className="text-red-600 text-sm mt-2">{sendError}</p>}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<main className="max-w-2xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>}>
      <TrackContent />
    </Suspense>
  );
}