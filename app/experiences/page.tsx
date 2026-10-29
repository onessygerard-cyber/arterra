import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import FadeImage from '@/components/FadeImage';
import { FORMAT_LABEL, SKILL_LABEL, formatDate, formatTime, todayIso } from '@/lib/experiences';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-14">
        {items.map(e => (
          <Link key={e.id} href={`/experiences/${e.id}`} className="group block">
            <div className="aspect-[4/3] bg-sand rounded-xl overflow-hidden">
              {e.image_url && (
                <FadeImage
                  src={e.image_url}
                  alt=""
                  className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                />
              )}
            </div>
            <p className="font-mono text-xs text-ink-soft mt-4">
              {formatDate(e.event_date)} · {formatTime(e.start_time)}
            </p>
            <h2 className="text-xl leading-snug mt-1">{e.title}</h2>
            <p className="text-sm text-ink-soft mt-1">
              Hosted by {e.artists?.name} · {FORMAT_LABEL[e.format]} · {SKILL_LABEL[e.skill_level]}
            </p>
            <p className="text-sm mt-2">
              {e.location} · <span className="font-medium">{e.price}</span>
            </p>
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