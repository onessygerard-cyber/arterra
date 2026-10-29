'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HostAttendees from '@/components/HostAttendees';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  FORMAT_LABEL, LOCKED_WHEN_LIVE, SKILL_LABEL, STATUS_LABEL, formatDate, formatTime, todayIso,
  type ExperienceFields,
} from '@/lib/experiences';

type Experience = ExperienceFields & { id: string; status: string };

type Form = {
  title: string; description: string; format: string; skill_level: string;
  event_date: string; start_time: string; duration_minutes: string; location: string;
  private_details: string; price: string; capacity: string; min_attendees: string;
  includes: string; bring: string; image_url: string;
};

const EMPTY: Form = {
  title: '', description: '', format: 'in_person', skill_level: 'all', event_date: '', start_time: '',
  duration_minutes: '120', location: '', private_details: '', price: '', capacity: '10',
  min_attendees: '1', includes: '', bring: '', image_url: '',
};

const MAX_BYTES = 4 * 1024 * 1024;
const input =
  'w-full min-h-11 border border-line rounded-lg px-4 py-2.5 bg-cream focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue disabled:opacity-50';
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gold/20 text-gold-deep',
  published: 'bg-blue/15 text-blue-deep',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-ink/10 text-ink-soft',
  completed: 'bg-ink/10 text-ink',
};

export default function ArtistExperiencesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [problem, setProblem] = useState('');
  const [items, setItems] = useState<Experience[]>([]);
  const [editing, setEditing] = useState<'new' | Experience | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const authFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const { data } = await supabaseBrowser.auth.getSession();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${data.session?.access_token ?? ''}`);
    return fetch(url, { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    const res = await authFetch('/api/my-experiences');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setProblem(data.error || 'Your experiences could not be loaded.'); return; }
    setItems(data.experiences || []);
  }, [authFetch]);

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();
      if (!data.session) { router.replace('/artist-login'); return; }
      await load();
      setChecking(false);
    }
    init();
  }, [router, load]);

  function openNew() {
    setEditing('new');
    setForm(EMPTY);
    setFile(null);
    setError('');
  }

  function openEdit(e: Experience) {
    setEditing(e);
    setForm({
      title: e.title, description: e.description, format: e.format, skill_level: e.skill_level,
      event_date: e.event_date, start_time: formatTime(e.start_time),
      duration_minutes: String(e.duration_minutes), location: e.location,
      private_details: e.private_details, price: e.price, capacity: String(e.capacity),
      min_attendees: String(e.min_attendees), includes: e.includes, bring: e.bring,
      image_url: e.image_url || '',
    });
    setFile(null);
    setError('');
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const picked = e.target.files?.[0] || null;
    if (picked && picked.size > MAX_BYTES) {
      setError('That image is over 4 MB. Please choose a smaller one.');
      e.target.value = '';
      return;
    }
    setFile(picked);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    let imageUrl = form.image_url;
    if (file) {
      const upload = new FormData();
      upload.append('file', file);
      const up = await authFetch('/api/upload-image', { method: 'POST', body: upload });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok) {
        setBusy(false);
        setError(upData.error || 'The cover image could not be uploaded.');
        return;
      }
      imageUrl = upData.imageUrl;
    }

    const res = await authFetch('/api/my-experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing && editing !== 'new' ? editing.id : undefined,
        ...form,
        image_url: imageUrl,
        duration_minutes: Number(form.duration_minutes),
        capacity: Number(form.capacity),
        min_attendees: Number(form.min_attendees),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || 'It could not be saved.'); return; }
    setEditing(null);
    await load();
  }

  async function cancel(e: Experience) {
    if (!confirm(`Cancel "${e.title}"? If people have already booked, ARTERRA will let them know.`)) return;
    const res = await authFetch('/api/my-experiences/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: e.id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'It could not be cancelled.');
      return;
    }
    await load();
  }

  if (checking) return <main className="max-w-3xl mx-auto mt-16 px-6 text-ink-soft">Loading…</main>;

  if (problem) {
    return (
      <main className="max-w-3xl mx-auto mt-16 px-6">
        <p className="text-ink-soft mb-4">{problem}</p>
        <Link href="/artist-login"
          className="inline-flex items-center min-h-11 px-5 rounded-lg border border-line bg-card text-sm font-medium hover:bg-sand">
          Artist Login
        </Link>
      </main>
    );
  }

  const live = !!editing && editing !== 'new' && editing.status === 'published';
  const locked = (key: keyof ExperienceFields) => live && LOCKED_WHEN_LIVE.includes(key);
  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (editing) {
    return (
      <main className="max-w-xl mx-auto mt-16 px-6 pb-24">
        <button onClick={() => setEditing(null)} className="text-sm underline text-blue-deep">Back to my experiences</button>
        <h1 className="text-2xl mt-4 mb-2">{editing === 'new' ? 'Host an experience' : 'Edit experience'}</h1>
        <p className="text-sm text-ink-soft mb-6">
          ARTERRA reviews every experience before it appears on the site.
          {live && ' This one is live, so only the description, what is included, what to bring, the private details and the cover image can change. To change anything else, contact ARTERRA.'}
        </p>

        <form onSubmit={save} className="space-y-4 bg-card border border-line rounded-xl p-7 shadow-sm">
          <input required placeholder="Title, e.g. Watercolour for beginners" value={form.title}
            onChange={set('title')} disabled={locked('title')} maxLength={120} className={input} />
          <textarea required rows={5} placeholder="What will people do and learn?" value={form.description}
            onChange={set('description')} className={input} />

          <div className="grid grid-cols-2 gap-3">
            <select value={form.format} onChange={set('format')} disabled={locked('format')} className={input}>
              <option value="in_person">In person</option>
              <option value="online">Online</option>
            </select>
            <select value={form.skill_level} onChange={set('skill_level')} disabled={locked('skill_level')} className={input}>
              {Object.entries(SKILL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input required type="date" min={live ? undefined : todayIso()} value={form.event_date}
              onChange={set('event_date')} disabled={locked('event_date')} className={input} aria-label="Date" />
            <input required type="time" value={form.start_time}
              onChange={set('start_time')} disabled={locked('start_time')} className={input} aria-label="Start time (local)" />
          </div>
          <p className="text-xs text-ink-soft -mt-2">The date and time are local to where it takes place.</p>

          <input required type="number" min={15} max={720} step={15} placeholder="Length in minutes"
            value={form.duration_minutes} onChange={set('duration_minutes')}
            disabled={locked('duration_minutes')} className={input} aria-label="Length in minutes" />

          <input required placeholder={form.format === 'online' ? 'Online' : 'Venue and city, e.g. Kigali Arts Centre, Kigali'}
            value={form.location} onChange={set('location')} disabled={locked('location')} maxLength={160} className={input} />

          <div>
            <textarea rows={3}
              placeholder={form.format === 'online'
                ? 'Meeting link and joining instructions (private)'
                : 'Exact address and how to find you (private)'}
              value={form.private_details} onChange={set('private_details')} className={input} />
            <p className="text-xs text-ink-soft mt-1">
              Private. Only people ARTERRA has confirmed for this experience will see it.
            </p>
          </div>

          <input required placeholder='Price, e.g. "$35 per person" or "Free"' value={form.price}
            onChange={set('price')} disabled={locked('price')} maxLength={60} className={input} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input required type="number" min={1} max={100} value={form.capacity}
                onChange={set('capacity')} disabled={locked('capacity')} className={input} aria-label="Seats" />
              <p className="text-xs text-ink-soft mt-1">Seats</p>
            </div>
            <div>
              <input required type="number" min={1} max={100} value={form.min_attendees}
                onChange={set('min_attendees')} disabled={locked('min_attendees')} className={input} aria-label="Minimum to go ahead" />
              <p className="text-xs text-ink-soft mt-1">Minimum to go ahead</p>
            </div>
          </div>

          <textarea rows={2} placeholder="What's included, e.g. paints, canvas, refreshments" value={form.includes}
            onChange={set('includes')} className={input} />
          <textarea rows={2} placeholder="What to bring, e.g. an apron" value={form.bring}
            onChange={set('bring')} className={input} />

          <div>
            <label className="text-sm font-medium block mb-2">Cover image (JPG, PNG or WebP, under 4 MB)</label>
            {form.image_url && !file && (
              <img src={form.image_url} alt="" className="w-40 h-28 object-cover rounded-lg border border-line mb-2" />
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="w-full text-sm" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={busy}
            className="min-h-11 bg-ink text-cream px-6 rounded-lg font-medium hover:bg-brand-deep disabled:opacity-50">
            {busy ? 'Saving…' : live ? 'Save changes' : editing !== 'new' && editing.status === 'rejected' ? 'Save and resubmit' : 'Submit for review'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto mt-16 px-6 pb-24">
      <Link href="/artist/dashboard" className="text-sm underline text-blue-deep">Back to dashboard</Link>
      <div className="flex justify-between items-center gap-4 mt-4 mb-8 flex-wrap">
        <h1 className="text-2xl">My experiences</h1>
        <button onClick={openNew}
          className="min-h-11 bg-ink text-cream px-5 rounded-lg text-sm font-medium hover:bg-brand-deep">
          Host an experience
        </button>
      </div>

      {items.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          You haven&apos;t proposed an experience yet. Workshops and live sessions are a great way to meet buyers.
        </div>
      )}

      <div className="space-y-3">
        {items.map(e => (
          <div key={e.id} className="bg-card border border-line rounded-xl p-5 shadow-sm">
            <div className="flex gap-4">
              {e.image_url && <img src={e.image_url} alt="" className="w-24 h-24 object-cover rounded-lg border border-line shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start gap-3">
                  <p className="font-medium">{e.title}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[e.status] || ''}`}>
                    {STATUS_LABEL[e.status] || e.status}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">
                  {formatDate(e.event_date)} · {formatTime(e.start_time)} · {FORMAT_LABEL[e.format]}
                </p>
                <p className="text-sm text-ink-soft">{e.location} · {e.price} · {e.capacity} seats</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['pending', 'rejected', 'published'].includes(e.status) && (
                    <button onClick={() => openEdit(e)}
                      className="min-h-11 border border-line bg-card px-4 rounded-lg text-xs font-medium hover:bg-sand">
                      {e.status === 'rejected' ? 'Edit and resubmit' : 'Edit'}
                    </button>
                  )}
                  {e.status === 'published' && (
                    <Link href={`/experiences/${e.id}`}
                      className="inline-flex items-center min-h-11 border border-line bg-card px-4 rounded-lg text-xs font-medium hover:bg-sand">
                      View public page
                    </Link>
                  )}
                  {['pending', 'published'].includes(e.status) && (
                    <button onClick={() => cancel(e)}
                      className="min-h-11 border border-red-300 text-red-800 bg-card px-4 rounded-lg text-xs font-medium hover:bg-red-50">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}