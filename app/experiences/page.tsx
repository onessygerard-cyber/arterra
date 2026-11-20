import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import FadeImage from '@/components/FadeImage';
import Ticket from '@/components/Ticket';
import { FORMAT_LABEL, SKILL_LABEL, formatTime, todayIso } from '@/lib/experiences';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Experiences',
  description: 'Workshops and live art experiences hosted by independent artists.',
};

type Row = {
  id: string;
  title: string;
  format: string;
  skill_level: string;
  event_date: string;
  start_time: string;
  location: string;
  price: string;
  image_url: string | null;
  artists: { name: string } | null;
};

function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

async function load(): Promise<Row[]> {
  try {
    const { data } = await supabaseAdmin
      .from('experiences')
      .select('id, title, format, skill_level, event_date, start_time, location, price, image_url, artists!inner(name)')
      .eq('artists.status', 'verified')
      .eq('status', 'published')
      .gte('event_date', todayIso())
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });
    return (data || []) as unknown as Row[];
  } catch {
    return [];
  }
}

export default async function ExperiencesPage() {
  const items = await load();

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <h1 className="text-3xl mb-2">Art Experiences</h1>
      <p className="text-ink-soft mb-12 max-w-prose">
        Workshops and live sessions hosted by independent artists. Times are local to where each experience takes place.
      </p>

      {items.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-10 text-center text-ink-soft bg-card/50">
          <p>No experiences are scheduled yet.</p>
          <p className="text-sm mt-2">
            Are you an artist? You can host one from your dashboard.{' '}
            <Link href="/artist-login" className="underline text-blue-deep">Artist Login</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
        {items.map(e => (
          <Link key={e.id} href={`/experiences/${e.id}`} className="group block">
            <Ticket
              layout="stacked"
              tone="live"
              className="transition-transform duration-500 motion-safe:group-hover:-translate-y-1"
              main={
                <>
                  <div className="-mx-6 -mt-7 mb-5 aspect-[4/3] overflow-hidden bg-sand">
                    {e.image_url && (
                      <FadeImage
                        src={e.image_url}
                        alt=""
                        className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <h2 className="text-xl leading-snug">{e.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Hosted by {e.artists?.name} · {FORMAT_LABEL[e.format]} · {SKILL_LABEL[e.skill_level]}
                  </p>
                  <p className="mt-2 text-sm">{e.location}</p>
                </>
              }
              stub={
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-ink-soft">{shortDate(e.event_date)}</p>
                    <p className="font-display text-2xl leading-none">{formatTime(e.start_time)}</p>
                  </div>
                  <p className="text-right text-sm font-medium">{e.price}</p>
                </div>
              }
            />
          </Link>
        ))}
      </div>

      <section className="mt-20 border-t border-line pt-10">
        <h2 className="text-xl mb-2">Planning something for a group?</h2>
        <p className="text-ink-soft mb-4 max-w-prose">
          Ask for a private workshop for your team, a celebration or a community group.
        </p>
        <Link href="/experiences/private"
          className="inline-flex items-center min-h-11 px-6 rounded-full border border-brand text-brand font-semibold text-sm hover:bg-brand hover:text-cream transition-colors">
          Plan a private event
        </Link>
      </section>
    </main>
  );
}