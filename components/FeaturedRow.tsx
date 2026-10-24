import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import FadeImage from '@/components/FadeImage';
import AvailabilityMark from '@/components/AvailabilityMark';

type Featured = {
  id: string;
  title: string;
  price: string | null;
  price_on_request: boolean | null;
  image_url: string | null;
  artist_id: string;
  listing_type: string;
  status: string;
  artists: { name: string } | null;
};

async function loadFeatured(): Promise<Featured[]> {
  try {
    const { data } = await supabaseAdmin
      .from('artworks')
      .select('id, title, price, price_on_request, image_url, artist_id, listing_type, status, artists!inner(name)')
      .eq('artists.status', 'verified')
      .in('status', ['approved', 'sold'])
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);
    return (data || []) as unknown as Featured[];
  } catch {
    return [];
  }
}

export default async function FeaturedRow() {
  const items = await loadFeatured();
  if (items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      <section aria-labelledby="featured-title">
        <div className="flex items-baseline justify-between mb-8">
          <h2 id="featured-title" className="text-2xl">Featured</h2>
          <Link href="/explore" className="inline-flex items-center min-h-11 text-sm underline text-blue-deep">
            See all art
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-14">
          {items.map(a => {
            const price =
              a.price_on_request || !(a.price || '').trim() ? 'Price on request' : a.price;
            return (
              <Link key={a.id} href={`/artist/${a.artist_id}?piece=${a.id}`} className="group block">
                <div className="aspect-square">
                  {a.image_url ? (
                    <FadeImage
                      src={a.image_url}
                      alt=""
                      className="w-full h-full object-contain object-bottom drop-shadow-sm motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.015]"
                    />
                  ) : (
                    <div className="w-full h-full bg-sand" />
                  )}
                </div>
                <span className="block mt-4 font-display text-lg leading-snug">{a.title}</span>
                <span className="block text-xs text-ink-soft mt-1">
                  {a.artists?.name} · {a.listing_type === 'original' ? 'Original' : 'Print'}
                </span>
                <span className="block text-sm font-medium mt-2">
                  {price} <AvailabilityMark status={a.status} className="ml-2 align-middle" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}