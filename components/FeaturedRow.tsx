import Link from 'next/link';
import Reveal from '@/components/Reveal';
import FeaturedGrid, { type FeaturedItem } from '@/components/FeaturedGrid';
import { supabaseAdmin } from '@/lib/supabase-admin';

type Row = {
  id: string;
  title: string;
  price: string | null;
  price_on_request: boolean | null;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  artist_id: string;
  listing_type: string;
  status: string;
  artists: { name: string } | null;
};

async function loadFeatured(): Promise<FeaturedItem[]> {
  try {
    const { data } = await supabaseAdmin
      .from('artworks')
      .select(
        'id, title, price, price_on_request, image_url, image_width, image_height, artist_id, listing_type, status, artists!inner(name)'
      )
      .eq('artists.status', 'verified')
      .in('status', ['approved', 'sold'])
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    return ((data || []) as unknown as Row[]).map(r => ({
      id: r.id,
      title: r.title,
      price: r.price_on_request || !(r.price || '').trim() ? 'Price on request' : (r.price as string),
      image_url: r.image_url,
      image_width: r.image_width,
      image_height: r.image_height,
      artist_id: r.artist_id,
      artist: r.artists?.name ?? '',
      type: r.listing_type,
      status: r.status,
    }));
  } catch {
    return [];
  }
}

export default async function FeaturedRow() {
  const items = await loadFeatured();
  if (items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      <Reveal as="section" aria-labelledby="featured-title">
        <div className="flex items-baseline justify-between mb-8">
          <h2 id="featured-title" className="text-2xl">Featured</h2>
          <Link href="/explore" className="inline-flex items-center min-h-11 text-sm underline text-blue-deep">
            See all art
          </Link>
        </div>
        <FeaturedGrid items={items} />
      </Reveal>
    </div>
  );
}