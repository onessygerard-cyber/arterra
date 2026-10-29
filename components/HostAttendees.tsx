'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Data = { attendees: { name: string; seats: number }[]; capacity: number; min: number };

export default function HostAttendees({ experienceId }: { experienceId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setError('');
    const { data: session } = await supabaseBrowser.auth.getSession();
    const res = await fetch('/api/my-experiences/attendees?id=' + experienceId, {
      headers: { Authorization: `Bearer ${session.session?.access_token ?? ''}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setError(body.error || 'The attendee list could not be loaded.'); return; }
    setData(body);
  }

  const seats = data ? data.attendees.reduce((sum, a) => sum + a.seats, 0) : 0;

  return (
    <div className="mt-2">
      <button onClick={toggle} aria-expanded={open}
        className="min-h-11 text-sm underline text-blue-deep">
        {open ? 'Hide attendees' : 'Attendees'}
      </button>
      {open && (
        <div className="mt-1 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {data && (
            <>
              <p className="text-ink-soft">
                {seats} of {data.capacity} seats confirmed (minimum {data.min}).
              </p>
              {data.attendees.length === 0 ? (
                <p className="text-ink-soft">No confirmed attendees yet.</p>
              ) : (
                <ul className="list-disc pl-5 mt-1">
                  {data.attendees.map((a, i) => (
                    <li key={i}>{a.name}{a.seats > 1 ? ` (${a.seats} seats)` : ''}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-ink-soft mt-2">
                ARTERRA keeps attendees&apos; contact details. Ask the team if you need to reach someone.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}