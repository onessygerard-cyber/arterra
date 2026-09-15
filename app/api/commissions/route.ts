import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { data: commission, error: commError } = await supabaseAdmin
    .from('commissions')
    .insert({
      brief_id: body.briefId,
      artist_id: body.artistId,
      price: body.price,
      timeline: body.timeline,
      status: 'proposed'
    })
    .select();

  if (commError) return NextResponse.json({ error: commError.message }, { status: 500 });

  const { error: briefError } = await supabaseAdmin
    .from('briefs')
    .update({ status: 'matched' })
    .eq('id', body.briefId);

  if (briefError) return NextResponse.json({ error: briefError.message }, { status: 500 });

  return NextResponse.json({ success: true, commission: commission[0] });
}