import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { artworkImagePath } from '@/lib/storage-path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const artistId = String(body.artistId || '');

  const { data: artist } = await supabaseAdmin
    .from('artists').select('photo_url').eq('id', artistId).maybeSingle();
  if (!artist) return NextResponse.json({ error: 'Artist not found.' }, { status: 404 });

  const { error } = await supabaseAdmin.from('artists').update({ photo_url: null }).eq('id', artistId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const path = artworkImagePath(artist.photo_url);
  if (path) await supabaseAdmin.storage.from('artwork-images').remove([path]);

  return NextResponse.json({ success: true });
}