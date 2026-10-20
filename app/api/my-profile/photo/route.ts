import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { rateLimited } from '@/lib/rate-limit';
import { artworkImagePath } from '@/lib/storage-path';
import { NextResponse } from 'next/server';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

async function removeOld(artistId: string, url: string | null | undefined) {
  const path = artworkImagePath(url);
  if (path && path.startsWith(`profiles/${artistId}/`)) {
    await supabaseAdmin.storage.from('artwork-images').remove([path]);
  }
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const { data: current } = await supabaseAdmin
    .from('artists').select('photo_url').eq('id', auth.artist.id).maybeSingle();

  if ((request.headers.get('content-type') || '').includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    if (body.remove !== true) return NextResponse.json({ error: 'Nothing to do.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('artists').update({ photo_url: null }).eq('id', auth.artist.id);
    if (error) return NextResponse.json({ error: 'The photo could not be removed.' }, { status: 500 });
    await removeOld(auth.artist.id, current?.photo_url);
    return NextResponse.json({ success: true });
  }

  if (await rateLimited(request, 'profile-photo', 10, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please use a JPG, PNG or WebP image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'The image must be under 4 MB.' }, { status: 400 });

  const path = `profiles/${auth.artist.id}/${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 12)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from('artwork-images')
    .upload(path, buffer, { contentType: file.type });
  if (uploadError) return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });

  const { data: pub } = supabaseAdmin.storage.from('artwork-images').getPublicUrl(path);
  const { error } = await supabaseAdmin
    .from('artists').update({ photo_url: pub.publicUrl }).eq('id', auth.artist.id);
  if (error) return NextResponse.json({ error: 'The photo could not be saved.' }, { status: 500 });

  await removeOld(auth.artist.id, current?.photo_url);
  return NextResponse.json({ success: true, photoUrl: pub.publicUrl });
}