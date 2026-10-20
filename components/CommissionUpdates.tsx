'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export type CommissionUpdate = {
  id: string;
  url: string;
  caption: string;
  decision: string;
  buyer_comment: string;
  created_at: string;
};

const MAX_BYTES = 4 * 1024 * 1024;

const DECISION_LABEL: Record<string, string> = {
  pending: 'Waiting for the buyer',
  approved: 'Approved by the buyer',
  changes_requested: 'The buyer asked for changes',
};
const DECISION_COLOR: Record<string, string> = {
  pending: 'bg-gold/20 text-gold-deep',
  approved: 'bg-blue/15 text-blue-deep',
  changes_requested: 'bg-red-100 text-red-800',
};

export default function CommissionUpdates({
  commissionId,
  status,
  updates,
  onChanged,
}: {
  commissionId: string;
  status: string;
  updates: CommissionUpdate[];
  onChanged: () => void | Promise<void>;
}) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canAdd = status !== 'proposed' && status !== 'delivered';

  async function authHeader(): Promise<Record<string, string>> {
    const { data } = await supabaseBrowser.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token ?? ''}` };
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_BYTES) {
      setError('That image is over 4 MB. Please choose a smaller one.');
      setInputKey(k => k + 1);
      setFile(null);
      return;
    }
    setFile(picked);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Choose a photo first.'); return; }
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('commissionId', commissionId);
    form.append('caption', caption);
    form.append('file', file);
    const res = await fetch('/api/commission-updates', {
      method: 'POST',
      headers: await authHeader(),
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || 'The photo could not be uploaded.'); return; }
    setFile(null);
    setCaption('');
    setInputKey(k => k + 1);
    await onChanged();
  }

  async function remove(updateId: string) {
    if (!confirm('Remove this photo?')) return;
    const res = await fetch('/api/commission-updates/delete', {
      method: 'POST',
      headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ updateId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'The photo could not be removed.');
      return;
    }
    await onChanged();
  }

  return (
    <div className="border-t border-line pt-4 mb-4">
      <p className="text-sm font-medium mb-3">
        Progress photos <span className="font-mono text-xs text-ink-soft font-normal">({updates.length})</span>
      </p>

      {updates.length > 0 && (
        <div className="flex gap-4 flex-wrap mb-4">
          {updates.map(u => (
            <div key={u.id} className="w-40">
              <a href={u.url} target="_blank" rel="noreferrer">
                <img src={u.url} alt={u.caption || 'Progress photo'}
                  className="w-40 h-40 object-cover rounded-lg border border-line" />
              </a>
              {u.caption && <p className="text-xs mt-1">{u.caption}</p>}
              <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${DECISION_COLOR[u.decision] || ''}`}>
                {DECISION_LABEL[u.decision] || u.decision}
              </span>
              {u.buyer_comment && (
                <p className="text-xs text-ink-soft mt-1">&ldquo;{u.buyer_comment}&rdquo;</p>
              )}
              {u.decision === 'pending' && (
                <button onClick={() => remove(u.id)}
                  className="block min-h-11 text-xs underline text-ink-soft hover:text-ink">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAdd ? (
        <form onSubmit={upload} className="space-y-2">
          <input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp"
            onChange={pick} className="w-full text-sm" />
          <input placeholder="Caption, e.g. Underpainting finished" value={caption} maxLength={300}
            onChange={e => setCaption(e.target.value)}
            className="w-full min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={busy || !file}
            className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep disabled:opacity-50">
            {busy ? 'Uploading…' : 'Add progress photo'}
          </button>
        </form>
      ) : status === 'proposed' ? (
        <p className="text-xs text-ink-soft">
          You can add progress photos once ARTERRA marks the deposit as paid.
        </p>
      ) : null}
    </div>
  );
}