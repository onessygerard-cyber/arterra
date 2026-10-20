import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ArtistProfileClient from '@/components/ArtistProfileClient';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function short(text: string | null | undefined, max: number): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const query = await searchParams;
  const fallback: Metadata = { title: 'Artist' };
  if (!UUID.test(id)) return fallback;

  try {
    const { data: artist } = await supabaseAdmin
      .from('artists')
      .select('id, name, location, bio, photo_url')
      .eq('id', id)
      .eq('status', 'verified')
      .maybeSingle();
    if (!artist) return fallback;

    const pieceId = typeof query.piece === 'string' ? query.piece : '';
    let piece: { title: string; description: string | null; image_url: string | null } | null = null;
    if (UUID.test(pieceId)) {
      const { data } = await supabaseAdmin
        .from('artworks')
        .select('title, description, image_url')
        .eq('id', pieceId)
        .eq('artist_id', id)
        .in('status', ['approved', 'sold'])
        .maybeSingle();
      piece = data;
    }

    let image: string | null = piece?.image_url || artist.photo_url || null;
    if (!image) {
      const { data: first } = await supabaseAdmin
        .from('artworks')
        .select('image_url')
        .eq('artist_id', id)
        .in('status', ['approved', 'sold'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      image = first?.image_url || null;
    }

    const where = artist.location ? `, ${artist.location}` : '';
    const title = piece ? `${piece.title} by ${artist.name}` : artist.name;
    const description = piece
      ? short(piece.description, 160) || `An original work by ${artist.name}${where}.`
      : short(artist.bio, 160) || `Original art by ${artist.name}${where}.`;
    const imageUrl = image || '/og-image.png';

    return {
      title,
      description,
      openGraph: { title, description, siteName: 'ARTERRA', type: 'website', images: [{ url: imageUrl }] },
      twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
    };
  } catch {
    return fallback;
  }
}

export default function ArtistPage() {
  return <ArtistProfileClient />;
}