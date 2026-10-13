'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function ArtistLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (data.session) { router.replace('/artist/dashboard'); return; }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      setError(error.status === 429
        ? 'Too many attempts. Please wait a few minutes and try again.'
        : 'That email and password do not match.');
      return;
    }
    router.push('/artist/dashboard');
  }

  const inputClass = "w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) return <main className="max-w-sm mx-auto mt-24 px-6 text-ink-soft">Checking…</main>;

  return (
    <main className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-xl mb-1">Artist Login</h1>
      <p className="text-ink-soft text-sm mb-5">
        Sign in with the email and password ARTERRA sent you. Forgot it? Contact the ARTERRA team and we will reset it.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 bg-card border border-line rounded-xl p-6 shadow-sm">
        <input required type="email" autoComplete="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} className={inputClass} />
        <div className="relative">
          <input required type={showPassword ? 'text' : 'password'} autoComplete="current-password"
            placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} className={inputClass + ' pr-16'} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-soft hover:text-ink">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={submitting}
          className="min-h-11 bg-ink text-cream px-5 rounded-lg font-medium hover:bg-brand-deep w-full disabled:opacity-50">
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}