import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: artists } = await supabaseAdmin
    .from('artists')
    .select('id, name, location, mediums, styles, bio, price_range')
    .eq('status', 'verified');
  const { data: artworks } = await supabaseAdmin
    .from('artworks')
    .select('*, artists(name)')
    .in('status', ['approved', 'sold']);

  return NextResponse.json({ artists: artists || [], artworks: artworks || [] });
}