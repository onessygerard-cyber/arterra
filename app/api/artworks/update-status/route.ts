import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { error } = await supabaseAdmin
    .from('artworks')
    .update({ status: body.status })
    .eq('id', body.artworkId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}