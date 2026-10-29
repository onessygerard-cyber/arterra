'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Row = {
  id: string;
  name: string;
  contact: string;
  agreement_signed_on: string | null;
  agreement_note: string | null;
};

const card = 'bg-card border border-line rounded-xl p-5 shadow-sm';
const btnDark = 'min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep disabled:opacity-50';
const btnLight = 'min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand disabled:opacity-50';
const btnDanger = 'min-h-11 border border-red-300 text-red-800 bg-card px-4 rounded-lg text-sm font-medium hover:bg-red-50';
const input =
  'w-full min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue';

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA');
}

function pretty(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function AgreementsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [required, setRequired] = useState(false);
  const [settingAvailable, setSettingAvailable] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    const res = await authFetch('/api/studio-agreements');
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadError(data.error || 'The agreements could not be loaded.');
      return;
    }
    setLoadError('');
    setRows(data.artists || []);
    setRequired(!!data.required);
    setSettingAvailable(data.settingAvailable !== false);
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

  function startEdit(r: Row) {
    setEditing(r.id);
    setDate(r.agreement_signed_on || todayLocal());
    setNote(r.agreement_note || '');
    setError('');
  }

  async function post(url: string, payload: Record<string, unknown>) {
    return authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async function save(artistId: string) {
    if (!date) { setError('Choose the date it was signed.'); return; }
    setBusy(true);
    setError('');
    const res = await post('/api/artists/agreement', { artistId, signedOn: date, note });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || 'It could not be saved.'); return; }
    setEditing(null);
    await load();
  }

  async function clearSigned(r: Row) {
    if (!confirm(`Remove the signed record for ${r.name}?`)) return;
    const res = await post('/api/artists/agreement', { artistId: r.id, signedOn: '' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'It could not be removed.');
      return;
    }
    await load();
  }

  const unsigned = rows.filter(r => !r.agreement_signed_on);

  async function toggleRule() {
    const next = !required;
    if (
      next &&
      unsigned.length > 0 &&
      !confirm(
        `${unsigned.length} verified ${unsigned.length === 1 ? 'artist has' : 'artists have'} not signed. You will not be able to match new requests with ${unsigned.length === 1 ? 'them' : 'any of them'} until you record a signature. Commissions that already exist are not affected. Turn the rule on?`
      )
    ) {
      return;
    }
    const res = await post('/api/artists/agreement-required', { required: next });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || 'The rule could not be saved.'); return; }
    setRequired(next);
  }

  function copyUnsigned() {
    if (unsigned.length === 0) { alert('Every verified artist has signed.'); return; }
    navigator.clipboard.writeText(unsigned.map(r => `${r.name}: ${r.contact}`).join('\n'));
    alert('Copied the names and contact details of the artists who have not signed.');
  }

  if (checking) return <main className="max-w-3xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-3xl mx-auto mt-16 px-6 pb-24">
      <a href="/studio" className="text-sm underline text-blue-deep">Back to Studio</a>
      <h1 className="text-2xl mt-4 mb-2">Artist agreements</h1>
      <p className="text-sm text-ink-soft mb-8 max-w-prose">
        A record of who has signed the Artist Marketplace Agreement. It is kept for you only and is never shown on the
        public site. Keep the signed copies somewhere safe, and use the note to say which one it is.
      </p>

      {loadError && (
        <p className="text-red-600 text-sm mb-6">{loadError}</p>
      )}

      <div className={`${card} mb-8`}>
        <p className="font-medium mb-1">
          Block matching with unsigned artists: <span className="font-mono">{required ? 'ON' : 'OFF'}</span>
        </p>
        <p className="text-sm text-ink-soft mb-3">
          When this is on, you cannot match a new request with an artist who has not signed. It does not affect
          commissions that already exist, artwork listings or experiences.
        </p>
        {!settingAvailable && (
          <p className="text-sm text-red-600 mb-3">
            This setting is not available yet. Run the agreements SQL in Supabase first.
          </p>
        )}
        <button className={required ? btnLight : btnDark} onClick={toggleRule} disabled={!settingAvailable}>
          {required ? 'Turn the rule off' : 'Turn the rule on'}
        </button>
      </div>

      <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-lg">
          Verified artists{' '}
          <span className="font-mono text-sm text-ink-soft font-normal">
            ({rows.length - unsigned.length} of {rows.length} signed)
          </span>
        </h2>
        <button className={btnLight} onClick={copyUnsigned}>Copy unsigned artists</button>
      </div>

      {rows.length === 0 && !loadError && (
        <p className="text-ink-soft text-sm">No verified artists yet.</p>
      )}

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className={card}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs font-mono text-ink-soft break-all">{r.contact}</p>
              </div>
              {r.agreement_signed_on ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue/15 text-blue-deep whitespace-nowrap">
                  Signed {pretty(r.agreement_signed_on)}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/20 text-gold-deep whitespace-nowrap">
                  Not signed
                </span>
              )}
            </div>
            {r.agreement_note && <p className="text-sm text-ink-soft mt-2">{r.agreement_note}</p>}

            {editing === r.id ? (
              <div className="mt-4 pt-4 border-t border-line space-y-2">
                <label className="text-xs font-medium text-ink-soft block">Date signed</label>
                <input type="date" value={date} max={todayLocal()} onChange={e => setDate(e.target.value)} className={input} />
                <input placeholder="Note, e.g. Draft 1.0, paper copy in the office file" value={note}
                  maxLength={200} onChange={e => setNote(e.target.value)} className={input} />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button className={btnDark} onClick={() => save(r.id)} disabled={busy}>
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                  <button className={btnLight} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                <button className={btnLight} onClick={() => startEdit(r)}>
                  {r.agreement_signed_on ? 'Edit' : 'Record signature'}
                </button>
                {r.agreement_signed_on && (
                  <button className={btnDanger} onClick={() => clearSigned(r)}>Remove record</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}