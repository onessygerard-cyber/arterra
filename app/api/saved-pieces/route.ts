import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { 'Cache-Control': 'no-store' };

type Row = {
  id: string;
  title: string;
  price: string | null;
  price_on_request: boolean | null;
  image_url: string | null;
  status: string;
  artist_id: string;
  artists: { name: string } | null;
};

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('ids') || '';
  const ids = Array.from(
    new Set(raw.split(',').map(s => s.trim()).filter(s => UUID.test(s)))
  ).slice(0, 24);

  if (ids.length === 0) return NextResponse.json({ pieces: [] }, { headers: NO_STORE });

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .select('id, title, price, price_on_request, image_url, status, artist_id, artists!inner(name)')
    .in('id', ids)
    .eq('artists.status', 'verified')
    .in('status', ['approved', 'sold']);

  if (error) {
    return NextResponse.json({ error: 'Saved pieces could not be loaded.' }, { status: 500, headers: NO_STORE });
  }

  const pieces = ((data || []) as unknown as Row[]).map(r => ({
    id: r.id,
    title: r.title,
    artist: r.artists?.name ?? '',
    artist_id: r.artist_id,
    price: r.price_on_request || !(r.price || '').trim() ? 'Price on request' : (r.price as string),
    status: r.status,
    image_url: r.image_url,
  }));

  return NextResponse.json({ pieces }, { headers: NO_STORE });
}