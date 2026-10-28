'use client';

import { useState } from 'react';
import { STAGE_LABEL, isRoundStage, type Stage } from '@/lib/stages';

export type TrackUpdate = {
  id: string;
  url: string;
  caption: string;
  decision: string;
  buyer_comment: string;
  created_at: string;
  stage: string;
};

const inputClass =
  'w-full border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

export default function BuyerPhotos({
  updates,
  delivered,
  token,
  onChanged,
}: {
  updates: TrackUpdate[];
  delivered: boolean;
  token: string;
  onChanged: () => void | Promise<void>;
}) {
  const [note, setNote] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(u: TrackUpdate, decision: 'approved' | 'changes_requested') {
    setError(prev => ({ ...prev, [u.id]: '' }));

    let confirmFinal = false;
    if (u.stage === 'final' && decision === 'approved') {
      const ok = window.confirm(
        'Approving the final artwork confirms you are happy with it. After this, the commission cannot be cancelled or refunded for a change of preference, except where the law requires it. Approve the final artwork?'
      );
      if (!ok) return;
      confirmFinal = true;
    }

    setBusy(u.id);
    try {
      const res = await fetch('/api/commission-updates/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackToken: token,
          updateId: u.id,
          decision,
          comment: note[u.id] || '',
          confirmFinal,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(prev => ({ ...prev, [u.id]: data.error || 'Your response could not be saved.' }));
        return;
      }
      setEditing(null);
      setNote(prev => ({ ...prev, [u.id]: '' }));
      await onChanged();
    } catch {
      setError(prev => ({
        ...prev,
        [u.id]: 'Your response could not be saved. Check your connection and try again.',
      }));
    } finally {
      setBusy(null);
    }
  }

  if (updates.length === 0) return null;

  return (
    <div className="border-t border-line pt-4 mb-5">
      <h2 className="text-base mb-3">Progress photos</h2>
      <div className="space-y-8">
        {updates.map(u => {
          const label = STAGE_LABEL[u.stage as Stage] || 'Progress update';
          const decided = u.decision !== 'pending';
          const isRound = isRoundStage(u.stage);
          const roundUsedElsewhere =
            isRound &&
            updates.some(x => x.id !== u.id && x.stage === u.stage && x.decision === 'changes_requested');
          const finalLocked = u.stage === 'final' && u.decision === 'approved';
          const showForm = !delivered && !finalLocked && (!decided || editing === u.id);
          const approveLabel =
            u.stage === 'final' ? 'Approve final artwork' : u.stage === 'update' ? 'Looks good' : 'Approve';

          return (
            <div key={u.id}>
              <p className="font-mono text-xs text-ink-soft mb-2">{label}</p>
              <a href={u.url} target="_blank" rel="noreferrer" aria-label="Open the full size photo in a new tab">
                <img
                  src={u.url}
                  alt={u.caption || label}
                  className="max-h-72 w-auto max-w-full rounded-lg border border-line"
                />
              </a>
              {u.caption && <p className="text-sm mt-2">{u.caption}</p>}

              {decided && editing !== u.id && (
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    {u.decision === 'approved'
                      ? u.stage === 'final'
                        ? 'You approved the final artwork.'
                        : 'You approved this photo.'
                      : 'You asked for changes.'}
                  </p>
                  {u.buyer_comment && <p className="text-sm text-ink-soft">{u.buyer_comment}</p>}
                  {!delivered && !finalLocked && (
                    <button
                      onClick={() => {
                        setEditing(u.id);
                        setNote(prev => ({ ...prev, [u.id]: u.buyer_comment }));
                      }}
                      className="min-h-11 text-sm underline text-ink-soft hover:text-ink"
                    >
                      Change my response
                    </button>
                  )}
                </div>
              )}

              {showForm && (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={note[u.id] || ''}
                    onChange={e => setNote(prev => ({ ...prev, [u.id]: e.target.value }))}
                    placeholder={
                      isRound
                        ? 'Describe all the changes you would like (needed to request changes)'
                        : 'Add a note (optional)'
                    }
                    className={inputClass}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => respond(u, 'approved')}
                      disabled={busy === u.id}
                      className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep disabled:opacity-50"
                    >
                      {approveLabel}
                    </button>
                    {isRound && (
                      <button
                        onClick={() => respond(u, 'changes_requested')}
                        disabled={busy === u.id || roundUsedElsewhere}
                        className="min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand disabled:opacity-50"
                      >
                        Request changes
                      </button>
                    )}
                    {editing === u.id && (
                      <button
                        onClick={() => setEditing(null)}
                        className="min-h-11 px-3 text-sm text-ink-soft underline hover:text-ink"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {isRound && !roundUsedElsewhere && (
                    <p className="text-xs text-ink-soft">
                      Your order includes one round of changes at each of the concept, sketch and preliminary
                      colours stages. Please send all your changes for this stage together.
                    </p>
                  )}
                  {isRound && roundUsedElsewhere && (
                    <p className="text-xs text-ink-soft">
                      The included round of changes for this stage has been used. You can approve, or message the
                      artist below. Further changes need a new price and timeline agreed with ARTERRA.
                    </p>
                  )}
                  {u.stage === 'final' && (
                    <p className="text-xs text-ink-soft">
                      Want something changed? Message the artist below. Changes beyond the included rounds need a
                      new agreement with ARTERRA.
                    </p>
                  )}
                  {error[u.id] && <p className="text-red-600 text-sm">{error[u.id]}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}