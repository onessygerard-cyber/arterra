'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type ArtistRow = { id: string; name: string; contact: string; loginEmail: string | null };

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export default function ArtistLoginsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    const res = await authFetch('/api/studio-artists');
    if (res.status === 401) {
      await supabaseBrowser.auth.signOut();
      router.push('/studio/login');
      return;
    }
    const data = await res.json();
    setArtists(data.artists || []);
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

  function openForm(a: ArtistRow) {
    setOpenId(a.id);
    setEmail(a.loginEmail || (a.contact.includes('@') ? a.contact : ''));
    setPassword(generatePassword());
    setError('');
    setDone(null);
    setCopied(false);
  }

  async function save(a: ArtistRow) {
    setSaving(true);
    setError('');
    const res = await authFetch('/api/artists/set-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artistId: a.id, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Could not save this login.'); return; }
    setDone({ name: a.name, email: email.trim().toLowerCase(), password });
    setOpenId(null);
    load();
  }

  function copyMessage() {
    if (!done) return;
    const text =
      `Hi ${done.name}, your ARTERRA artist login is ready.\n` +
      `Sign in: ${window.location.origin}/artist-login\n` +
      `Email: ${done.email}\n` +
      `Password: ${done.password}\n` +
      `Please change your password after you sign in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass = "w-full min-h-11 border border-line rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) return <main className="max-w-4xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-20">
      <a href="/studio" className="text-sm underline text-blue-deep">Back to Studio</a>
      <h1 className="text-2xl mt-4 mb-2">Artist logins</h1>
      <p className="text-ink-soft text-sm mb-8 max-w-prose">
        Set a first password for each approved artist, then send them the details yourself, for example on WhatsApp.
        They can change it after they sign in. Open this page on the live site so the sign-in link in the message is correct.
      </p>

      {done && (
        <div className="bg-card border border-line rounded-xl p-5 shadow-sm mb-8">
          <p className="font-medium mb-1">Login saved for {done.name}</p>
          <p className="text-sm text-ink-soft mb-3">The password is shown only now. Copy it before you leave this page.</p>
          <p className="text-sm font-mono mb-3 break-all">{done.email} / {done.password}</p>
          <button onClick={copyMessage}
            className="min-h-11 bg-ink text-cream px-4 rounded-lg text-sm font-medium hover:bg-brand-deep">
            {copied ? 'Copied' : 'Copy message for WhatsApp'}
          </button>
        </div>
      )}

      {artists.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          No approved artists yet.
        </div>
      )}

      <div className="space-y-3">
        {artists.map(a => (
          <div key={a.id} className="bg-card border border-line rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs font-mono text-ink-soft">{a.contact}</p>
                <p className="text-sm text-ink-soft mt-1">
                  {a.loginEmail ? `Signs in with ${a.loginEmail}` : 'No login yet'}
                </p>
              </div>
              <button onClick={() => (openId === a.id ? setOpenId(null) : openForm(a))}
                className="min-h-11 border border-line bg-card px-4 rounded-lg text-sm font-medium hover:bg-sand whitespace-nowrap">
                {a.loginEmail ? 'Reset password' : 'Set login'}
              </button>
            </div>

            {openId === a.id && (
              <div className="mt-4 pt-4 border-t border-line space-y-2">
                <input className={inputClass} type="email" placeholder="Login email"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex gap-2">
                  <input className={inputClass} placeholder="Password (10+ characters)"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setPassword(generatePassword())}
                    className="min-h-11 border border-line bg-card px-4 rounded-lg text-sm hover:bg-sand whitespace-nowrap">
                    Generate
                  </button>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button onClick={() => save(a)} disabled={saving}
                  className="min-h-11 bg-ink text-cream px-5 rounded-lg text-sm font-medium hover:bg-brand-deep disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save login'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}