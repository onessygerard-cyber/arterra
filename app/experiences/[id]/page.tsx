import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Avatar from '@/components/Avatar';
import ReservePanel from '@/components/ReservePanel';
import {
  FORMAT_LABEL, SKILL_LABEL, formatDate, formatDuration, formatTime, shortText, todayIso,
} from '@/lib/experiences';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!UUID.test(id)) return null;
  try {
    const { data } = await supabaseAdmin
      .from('experiences')
      .select('*, artists!inner(id, name, photo_url, location, status)')
      .eq('id', id)
      .eq('artists.status', 'verified')
      .in('status', ['published', 'completed', 'cancelled'])
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = await load(id);
  if (!e) return { title: 'Experience' };

  const description =
    shortText(e.description, 160) || `A ${FORMAT_LABEL[e.format].toLowerCase()} experience hosted by ${e.artists.name}.`;
  const image = e.image_url || e.artists.photo_url || '/og-image.png';
  return {
    title: e.title,
    description,
    openGraph: { title: e.title, description, siteName: 'ARTERRA', type: 'website', images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title: e.title, description, images: [image] },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const { id } = await params;
  const e = await load(id);
  if (!e) notFound();

  const cancelled = e.status === 'cancelled';
  const { data: seatRows } = await supabaseAdmin
    .from('experience_bookings')
    .select('seats')
    .eq('experience_id', e.id)
    .eq('status', 'confirmed');
  const confirmedSeats = (seatRows || []).reduce((sum: number, r: { seats: number }) => sum + r.seats, 0);
  const seatsLeft = Math.max(0, e.capacity - confirmedSeats);
  const finished = e.status === 'completed' || e.event_date < todayIso();
  const state = cancelled ? 'cancelled' : finished ? 'finished' : 'open';

  const facts: [string, string][] = [
    ['Date', formatDate(e.event_date)],
    ['Starts', `${formatTime(e.start_time)} (local time)`],
    ['Length', formatDuration(e.duration_minutes)],
    ['Where', e.location],
    ['Format', FORMAT_LABEL[e.format]],
    ['Level', SKILL_LABEL[e.skill_level]],
    ['Seats', state === 'open' ? \${seatsLeft} left of ${e.capacity}` : String(e.capacity)],`
    ['Price', e.price],
  ];

  return (
    <main className="max-w-4xl mx-auto mt-16 px-6 pb-24">
      <Link href="/experiences" className="text-sm underline text-blue-deep">All experiences</Link>

      <div className="grid md:grid-cols-5 gap-10 mt-6">
        <div className="md:col-span-3">
          <div className="aspect-[4/3] bg-sand rounded-xl overflow-hidden mb-8">
            {e.image_url && <img src={e.image_url} alt="" className="w-full h-full object-cover" />}
          </div>

          <h1 className="text-3xl mb-4">{e.title}</h1>
          <p className="text-ink whitespace-pre-line mb-8">{e.description}</p>

          {e.includes && (
            <section className="mb-6">
              <h2 className="text-lg mb-1">What&apos;s included</h2>
              <p className="text-ink-soft whitespace-pre-line">{e.includes}</p>
            </section>
          )}
          {e.bring && (
            <section className="mb-6">
              <h2 className="text-lg mb-1">What to bring</h2>
              <p className="text-ink-soft whitespace-pre-line">{e.bring}</p>
            </section>
          )}
        </div>

        <aside className="md:col-span-2 space-y-6">
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
              {facts.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ReservePanel experienceId={e.id} state={state} seatsLeft={seatsLeft} />

          <Link
            href={`/artist/${e.artists.id}`}
            className="flex items-center gap-3 bg-card border border-line rounded-xl p-4 hover:border-blue/40"
          >
            <Avatar name={e.artists.name} src={e.artists.photo_url} size={48} />
            <span>
              <span className="block text-xs text-ink-soft">Hosted by</span>
              <span className="block font-display text-lg leading-tight">{e.artists.name}</span>
              <span className="block text-xs text-ink-soft">{e.artists.location}</span>
            </span>
          </Link>
        </aside>
      </div>
    </main>
  );
}