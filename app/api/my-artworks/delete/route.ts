import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { artworkImagePath } from '@/lib/storage-path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data: artwork } = await supabaseAdmin
    .from('artworks')
    .select('id, artist_id, image_url')
    .eq('id', String(body.artworkId || ''))
    .maybeSingle();

  if (!artwork || artwork.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Piece not found.' }, { status: 404 });
  }

  await supabaseAdmin.from('artwork_inquiries').delete().eq('artwork_id', artwork.id);

  const { error } = await supabaseAdmin.from('artworks').delete().eq('id', artwork.id);
  if (error) return NextResponse.json({ error: 'The piece could not be removed.' }, { status: 500 });

  const path = artworkImagePath(artwork.image_url);
  if (path && path.startsWith(`${auth.artist.id}/`)) {
    await supabaseAdmin.storage.from('artwork-images').remove([path]);
  }
  return NextResponse.json({ success: true });
}