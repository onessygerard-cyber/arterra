import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists').select('*').eq('id', id).eq('status', 'verified').maybeSingle();

  if (artistError) return NextResponse.json({ error: artistError.message }, { status: 500 });
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

  const { data: artworks } = await supabaseAdmin
    .from('artworks').select('*').eq('artist_id', id).in('status', ['approved', 'sold']);

  return NextResponse.json({ artist, artworks: artworks || [] });
}