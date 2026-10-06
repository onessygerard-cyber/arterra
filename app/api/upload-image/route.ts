import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from('artwork-images')
    .upload(fileName, buffer, { contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from('artwork-images').getPublicUrl(fileName);
  return NextResponse.json({ success: true, imageUrl: data.publicUrl });
}