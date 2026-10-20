import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (await rateLimited(request, 'upload-reference', 12, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please use a JPG, PNG or WebP image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Each image must be under 4 MB.' }, { status: 400 });

  const path = `${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 12)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from('brief-references')
    .upload(path, buffer, { contentType: file.type });
  if (error) return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });

  return NextResponse.json({ success: true, path });
}