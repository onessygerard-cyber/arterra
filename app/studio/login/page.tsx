'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function StudioLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    router.push('/studio');
  }

  const inputClass = "w-full border border-line rounded-lg px-4 py-2.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue";

  return (
    <main className="max-w-sm mx-auto mt-24 px-6">
      <h1 className="text-xl mb-1">Studio login</h1>
      <p className="text-ink-soft text-sm mb-5">For the ARTERRA team.</p>
      <form onSubmit={handleLogin} className="space-y-3 bg-card border border-line rounded-xl p-6 shadow-sm">
        <input required type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass} />

        <div className="relative">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass + " pr-16"} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-soft hover:text-ink">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-ink text-cream px-5 py-2.5 rounded-lg font-medium hover:bg-blue-deep w-full">
          Log in
        </button>
      </form>
    </main>
  );
}