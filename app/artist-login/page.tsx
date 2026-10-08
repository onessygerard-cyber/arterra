'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function ArtistLoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (data.session) { router.push('/artist/dashboard'); return; }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/artist/dashboard`,
        shouldCreateUser: true,
      },
    });
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  if (checking) {
    return <main className="max-w-sm mx-auto mt-24 px-6 text-ink-soft">Checking…</main>;
  }

  if (sent) {
    return (
      <main className="max-w-sm mx-auto mt-24 px-6">
        <h1 className="text-xl mb-1">Check your email.</h1>
        <p className="text-ink-soft text-sm">We sent a login link to {email}. Click it to open your dashboard.</p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-xl mb-1">Artist Login</h1>
      <p className="text-ink-soft text-sm mb-5">Enter the email you registered with. We&apos;ll send you a login link.</p>
      <form onSubmit={handleSubmit} className="space-y-3 bg-card border border-line rounded-xl p-6 shadow-sm">
        <input required type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} className={inputClass} />
        {error && (
          <p className="text-red-600 text-sm">
            {error} Not registered yet?{' '}
            <Link href="/join" className="underline">Apply here</Link>.
          </p>
        )}
        <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-lg font-medium hover:bg-blue-deep w-full">
          Send Login Link
        </button>
      </form>
    </main>
  );
}