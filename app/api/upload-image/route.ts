import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { NextResponse } from 'next/server';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please upload a JPG, PNG, or WebP image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'The image must be under 4 MB.' }, { status: 400 });

  const fileName = `${auth.artist.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from('artwork-images')
    .upload(fileName, buffer, { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from('artwork-images').getPublicUrl(fileName);
  return NextResponse.json({ success: true, imageUrl: data.publicUrl });
}