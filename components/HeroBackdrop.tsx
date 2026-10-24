import Image from 'next/image';
import { supabaseAdmin } from '@/lib/supabase-admin';

function supabaseHost(): string {
  try {
    return new URL(process.env.SUPABASE_URL || '').hostname;
  } catch {
    return '';
  }
}

async function loadImages(skip: number, take: number): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from('artworks')
      .select('image_url, artists!inner(status)')
      .eq('artists.status', 'verified')
      .in('status', ['approved', 'sold'])
      .not('image_url', 'is', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(skip + take);

    const host = supabaseHost();
    const urls = (data || [])
      .map((row: { image_url: string | null }) => row.image_url || '')
      .filter((u: string) => {
        try {
          return host !== '' && new URL(u).hostname === host;
        } catch {
          return false;
        }
      });
    const slice = urls.slice(skip, skip + take);
    return slice.length > 0 ? slice : urls.slice(0, take);
  } catch {
    return [];
  }
}

export default async function HeroBackdrop({
  skip = 0,
  take = 6,
  flip = false,
}: {
  skip?: number;
  take?: number;
  flip?: boolean;
}) {
  const urls = await loadImages(skip, take);
  const cols = Math.min(Math.max(urls.length, 1), 3);
  const rows = Math.ceil(urls.length / cols) || 1;

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <Image
        src="/hero-brushwork.jpg"
        alt=""
        fill
        sizes="100vw"
        className={`object-cover opacity-40 ${flip ? '-scale-x-100' : ''}`}
      />

      {urls.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 w-full md:w-[70%] grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="relative">
              <Image
                src={u}
                alt=""
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover opacity-30 saturate-75"
              />
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-night via-night/90 to-night/30" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night to-transparent" />
    </div>
  );
}