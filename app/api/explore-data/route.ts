import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: artists } = await supabaseAdmin
    .from('artists')
    .select('id, name, location, mediums, styles, bio, price_range, photo_url')
    .eq('status', 'verified');

  const { data: artworks } = await supabaseAdmin
    .from('artworks')
    .select('*, artists!inner(name)')
    .eq('artists.status', 'verified')
    .in('status', ['approved', 'sold'])
    .order('created_at', { ascending: false });

  return NextResponse.json({ artists: artists || [], artworks: artworks || [] });
}