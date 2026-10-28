'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type ReviewRow = {
  id: string; rating: number; body: string; display_name: string; status: string;
  created_at: string; artists: { name: string } | null;
};
type UpdateRow = {
  id: string; url: string; caption: string; decision: string; buyer_comment: string; created_at: string; stage?: string;
  commissions: { briefs: { buyer_name: string } | null; artists: { name: string } | null } | null;
};

const DECISION_LABEL: Record<string, string> = {
  pending: 'Waiting for the buyer',
  approved: 'Approved',
  changes_requested: 'Changes requested',
};

const card = 'bg-card border border-line rounded-xl p-5 shadow-sm';
const btnLight = 'min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand';
const btnDanger = 'min-h-11 border border-red-300 text-red-800 bg-card px-4 rounded-lg text-sm font-medium hover:bg-red-50';

export default function ModerationPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    const res = await authFetch('/api/studio-moderation');
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    const data = await res.json();
    setReviews(data.reviews || []);
    setUpdates(data.updates || []);
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

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <a href="/studio" className="text-sm underline text-blue-deep">Back to Studio</a>
      <h1 className="text-2xl mt-4 mb-10">Reviews and progress updates</h1>

      <section className="mb-14">
        <h2 className="text-lg mb-4">
          Reviews <span className="font-mono text-sm text-ink-soft font-normal">({reviews.length})</span>
        </h2>
        {reviews.length === 0 && <p className="text-ink-soft text-sm">No reviews yet.</p>}
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={`${card} ${r.status === 'hidden' ? 'opacity-70' : ''}`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">
                    {r.rating} out of 5 · {r.display_name}
                    {r.status === 'hidden' && (
                      <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-ink/10 text-ink-soft align-middle">Hidden</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-soft mb-2">
                    For {r.artists?.name || 'an artist'} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.body ? <p className="text-sm whitespace-pre-line">{r.body}</p> : <p className="text-sm text-ink-soft">No written review.</p>}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button className={btnLight}
                    onClick={() => post('/api/reviews/moderate', { reviewId: r.id, action: r.status === 'hidden' ? 'publish' : 'hide' })}>
                    {r.status === 'hidden' ? 'Publish' : 'Hide'}
                  </button>
                  <button className={btnDanger}
                    onClick={() => {
                      if (confirm('Delete this review permanently?')) {
                        post('/api/reviews/moderate', { reviewId: r.id, action: 'delete' });
                      }
                    }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg mb-4">
          Progress photos <span className="font-mono text-sm text-ink-soft font-normal">({updates.length})</span>
        </h2>
        {updates.length === 0 && <p className="text-ink-soft text-sm">No progress photos yet.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {updates.map(u => (
            <div key={u.id} className="bg-card border border-line rounded-xl overflow-hidden shadow-sm">
              {u.url && (
                <a href={u.url} target="_blank" rel="noreferrer">
                  <img src={u.url} alt={u.caption || 'Progress photo'} className="w-full h-44 object-cover" />
                </a>
              )}
              <div className="p-4">
                <p className="text-sm font-medium">
                  {u.commissions?.artists?.name || 'Artist'} for {u.commissions?.briefs?.buyer_name || 'buyer'}
                </p>
                {u.stage && <p className="text-xs font-mono text-ink-soft">{u.stage}</p>}
                {u.caption && <p className="text-sm">{u.caption}</p>}
                <p className="text-xs text-ink-soft mt-1">
                  {DECISION_LABEL[u.decision] || u.decision} · {new Date(u.created_at).toLocaleDateString()}
                </p>
                {u.buyer_comment && <p className="text-xs text-ink-soft mt-1">&ldquo;{u.buyer_comment}&rdquo;</p>}
                <button className={`${btnDanger} mt-3`}
                  onClick={() => {
                    if (confirm('Remove this photo?')) post('/api/commission-updates/delete', { updateId: u.id });
                  }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}