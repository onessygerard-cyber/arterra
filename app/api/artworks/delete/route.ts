import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const MARKER = '/storage/v1/object/public/artwork-images/';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const artworkId = String(body.artworkId || '');

  const { data: artwork } = await supabaseAdmin
    .from('artworks')
    .select('id, image_url')
    .eq('id', artworkId)
    .maybeSingle();
  if (!artwork) return NextResponse.json({ error: 'Artwork not found.' }, { status: 404 });

  await supabaseAdmin.from('artwork_inquiries').delete().eq('artwork_id', artwork.id);

  const { error } = await supabaseAdmin.from('artworks').delete().eq('id', artwork.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url: string = artwork.image_url || '';
  const idx = url.indexOf(MARKER);
  if (idx !== -1) {
    const path = decodeURIComponent(url.slice(idx + MARKER.length));
    await supabaseAdmin.storage.from('artwork-images').remove([path]);
  }

  return NextResponse.json({ success: true });
}