import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('id, name, location, mediums, styles, bio, price_range, turnaround, ships_to, photo_url')
    .eq('id', id)
    .eq('status', 'verified')
    .maybeSingle();

  if (artistError) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const { data: artworks } = await supabaseAdmin
    .from('artworks')
    .select('*')
    .eq('artist_id', id)
    .in('status', ['approved', 'sold'])
    .order('created_at', { ascending: false });

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating, body, display_name, created_at')
    .eq('artist_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ artist, artworks: artworks || [], reviews: reviews || [] });
}