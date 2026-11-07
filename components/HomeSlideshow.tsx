import type { ReactNode } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ArtSlideshow, { type Slide } from '@/components/ArtSlideshow';

type Row = {
  id: string;
  title: string;
  medium: string | null;
  year: string | null;
  status: string;
  image_url: string | null;
  artist_id: string;
  artists: { name: string } | null;
};

async function load(): Promise<Slide[]> {
  try {
    const { data } = await supabaseAdmin
      .from('artworks')
      .select('id, title, medium, year, status, image_url, artist_id, artists!inner(name)')
      .eq('artists.status', 'verified')
      .in('status', ['approved', 'sold'])
      .not('image_url', 'is', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8);

    return ((data || []) as unknown as Row[])
      .filter(r => r.image_url)
      .map(r => ({
        id: r.id,
        image: r.image_url as string,
        title: r.title,
        artist: r.artists?.name || '',
        detail: [r.medium, r.year].filter(Boolean).join(', '),
        href: `/artist/${r.artist_id}?piece=${r.id}`,
        status: r.status,
      }));
  } catch {
    return [];
  }
}

export default async function HomeSlideshow({ children }: { children?: ReactNode }) {
  const slides = await load();

  const list: Slide[] =
    slides.length > 0
      ? slides
      : [
          {
            id: 'brushwork',
            image: '/hero-brushwork.jpg',
            title: 'Your piece could hang here',
            artist: 'ARTERRA',
            detail: 'Artists, join us',
            href: '/join',
            fallback: true,
          },
        ];

  return <ArtSlideshow slides={list}>{children}</ArtSlideshow>;
}