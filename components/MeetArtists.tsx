import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { canOptimize } from '@/lib/image-host';

type ArtistRow = {
  id: string;
  name: string;
  location: string | null;
  bio: string | null;
  photo_url: string | null;
  mediums: string[] | null;
};

function score(a: ArtistRow): number {
  return (a.photo_url ? 2 : 0) + ((a.bio || '').trim() ? 1 : 0);
}

async function load(): Promise<ArtistRow[]> {
  try {
    const { data } = await supabaseAdmin
      .from('artists')
      .select('id, name, location, bio, photo_url, mediums')
      .eq('status', 'verified')
      .order('created_at', { ascending: true })
      .limit(24);
    return ((data || []) as ArtistRow[]).sort((x, y) => score(y) - score(x)).slice(0, 4);
  } catch {
    return [];
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export default async function MeetArtists() {
  const artists = await load();
  if (artists.length === 0) return null;

  return (
    <Reveal as="section" className="max-w-4xl mx-auto px-6 pt-20 pb-24" aria-labelledby="meet-title">
      <div className="mb-10 flex items-baseline justify-between gap-4">
        <h2 id="meet-title" className="text-2xl">Meet the artists</h2>
        <Link href="/explore" className="inline-flex min-h-11 items-center text-sm text-blue-deep underline">
          See all artists
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
        {artists.map(a => {
          const line =
            (a.bio || '').trim() ||
            (a.mediums && a.mediums.length > 0 ? `Works in ${a.mediums.join(', ').toLowerCase()}.` : '');
          return (
            <Link key={a.id} href={`/artist/${a.id}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-line bg-sand">
                {a.photo_url ? (
                  canOptimize(a.photo_url) ? (
                    <Image
                      src={a.photo_url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 200px, 45vw"
                      className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.04]"
                    />
                  ) : (
                    <img
                      src={a.photo_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )
                ) : (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center font-display text-5xl text-ink-soft"
                  >
                    {initials(a.name)}
                  </span>
                )}
              </div>
              <p className="mt-4 font-display text-xl leading-snug">{a.name}</p>
              {a.location && <p className="mt-0.5 font-mono text-xs text-ink-soft">{a.location}</p>}
              {line && <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{line}</p>}
            </Link>
          );
        })}
      </div>
    </Reveal>
  );
}