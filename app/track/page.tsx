'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const STAGES = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];
const STAGE_LABELS: Record<string, string> = {
  proposed: 'Quoted', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered'
};

type Message = { id: string; from_label: string; text: string; created_at: string };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  artists: { name: string } | null;
  commission_messages: Message[];
};
type Brief = { id: string; buyer_name: string; description: string; status: string };

function TrackContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [brief, setBrief] = useState<Brief | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

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
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionId, from: brief.buyer_name, text })
    });
    setDraft({ ...draft, [commissionId]: '' });
    const res = await fetch('/api/track?token=' + token);
    const data = await res.json();
    setCommissions(data.commissions);
  }

  if (loading) return <main className="max-w-2xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;
  if (notFound || !brief) return <main className="max-w-2xl mx-auto mt-16 px-6"><p className="text-ink-soft">We couldn&apos;t find that request. Check the link and try again.</p></main>;

  return (
    <main className="max-w-2xl mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">Your Request</h1>
      <p className="text-ink-soft mb-8">{brief.description}</p>

      {commissions.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-8 text-center text-ink-soft bg-card/50">
          We&apos;re still matching you with the right artist. Check back soon.
        </div>
      )}

      <div className="space-y-4">
        {commissions.map(c => {
          const stageIndex = STAGES.indexOf(c.status);
          const pct = ((stageIndex + 1) / STAGES.length) * 100;
          const messages = (c.commission_messages || []).slice().sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return (
            <div key={c.id} className="bg-card border border-line rounded-xl p-6 shadow-sm">
              <p className="font-medium">{c.artists?.name || 'Artist'}</p>
              <p className="text-sm text-ink-soft mb-3">{c.price} · {c.timeline}</p>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-1.5 bg-sand rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: pct + '%' }} />
                </div>
                <span className="text-xs font-mono text-ink-soft whitespace-nowrap">{STAGE_LABELS[c.status] || c.status}</span>
              </div>

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
                  className="flex-1 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
                <button onClick={() => sendMessage(c.id)}
                  className="bg-ink text-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-deep">
                  Send
                </button>
              </div>
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