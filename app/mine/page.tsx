'use client';

import { useState } from 'react';

const STAGES = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];
const STAGE_LABELS: Record<string, string> = {
  proposed: 'Quoted', deposit_paid: 'Deposit paid', in_progress: 'In progress',
  review: 'Final review', shipped: 'Shipped', delivered: 'Delivered'
};

type Message = { id: string; from_label: string; text: string; created_at: string };
type Commission = {
  id: string; price: string; timeline: string; status: string;
  briefs: { buyer_name: string; description: string } | null;
  artists: { name: string } | null;
  commission_messages: Message[];
};

export default function MyCommissionsPage() {
  const [contact, setContact] = useState('');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [searched, setSearched] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  async function search() {
    if (!contact.trim()) return;
    const res = await fetch('/api/my-commissions?contact=' + encodeURIComponent(contact.trim()));
    const data = await res.json();
    setCommissions(data.commissions || []);
    setSearched(true);
  }

  async function sendMessage(commissionId: string) {
    const text = draft[commissionId]?.trim();
    if (!text) return;
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionId, from: contact.trim(), text })
    });
    setDraft({ ...draft, [commissionId]: '' });
    search();
  }

  const inputClass = "border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  return (
    <main className="max-w-2xl mx-auto mt-16 px-6 pb-16">
      <h1 className="text-2xl mb-1">My commissions</h1>
    <p className="text-ink-soft mb-8">Enter the Email or WhatsApp number you used before.</p>

      <div className="flex gap-2 mb-10">
        <input placeholder="you@example.com" value={contact}
          onChange={e => setContact(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className={inputClass + " flex-1"} />
        <button onClick={search} className="bg-ink text-cream px-5 py-2.5 rounded-lg font-medium hover:bg-blue-deep">
          Find mine
        </button>
      </div>

      {searched && commissions.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-8 text-center text-ink-soft bg-card/50">
          Nothing here yet. Once your brief is matched or your application approved, it&apos;ll show up here.
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
              <p className="font-medium">{c.briefs?.description?.slice(0, 60) || 'Commission'}</p>
              <p className="text-sm text-ink-soft mb-3">
                {c.artists?.name || 'Artist'} · {c.price} · {c.timeline}
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-1.5 bg-sand rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: pct + '%' }} />
                </div>
                <span className="text-xs font-mono text-ink-soft whitespace-nowrap">
                  {STAGE_LABELS[c.status] || c.status}
                </span>
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
                  className={inputClass + " flex-1 text-sm py-2"} />
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