'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.replace('/artist-login'); return; }
      setChecking(false);
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 10) { setError('Use at least 10 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setSaving(true);
    const { error } = await supabaseBrowser.auth.updateUser({ password });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setDone(true);
  }

  const inputClass = "w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) return <main className="max-w-sm mx-auto mt-24 px-6 text-ink-soft">Checking…</main>;

  if (done) {
    return (
      <main className="max-w-sm mx-auto mt-24 px-6">
        <h1 className="text-xl mb-2">Password updated.</h1>
        <Link href="/artist/dashboard"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-xl mb-1">Change Password</h1>
      <p className="text-ink-soft text-sm mb-5">Use at least 10 characters.</p>
      <form onSubmit={handleSubmit} className="space-y-3 bg-card border border-line rounded-xl p-6 shadow-sm">
        <input required type="password" autoComplete="new-password" placeholder="New password"
          value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
        <input required type="password" autoComplete="new-password" placeholder="Repeat new password"
          value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={saving}
          className="min-h-11 bg-ink text-cream px-5 rounded-lg font-medium hover:bg-brand-deep w-full disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </main>
  );
}