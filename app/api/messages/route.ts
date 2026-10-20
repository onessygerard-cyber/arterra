import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { requireArtist } from '@/lib/require-artist';
import { rateLimited } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (await rateLimited(request, 'messages', 30, 600)) {
    return NextResponse.json({ error: 'Too many messages. Please wait a few minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const commissionId = String(body.commissionId || '');
  const text = String(body.text || '').trim().slice(0, 2000);
  if (!commissionId || !text) {
    return NextResponse.json({ error: 'Write a message first.' }, { status: 400 });
  }

  const { data: commission } = await supabaseAdmin
    .from('commissions')
    .select('id, artist_id, brief_id')
    .eq('id', commissionId)
    .maybeSingle();
  if (!commission) return NextResponse.json({ error: 'Commission not found.' }, { status: 404 });

  let from: string | null = null;

  if (request.headers.get('authorization')) {
    const artist = await requireArtist(request);
    if (artist && artist.artist.id === commission.artist_id) {
      from = artist.artist.name;
    } else if (await requireAdmin(request)) {
      from = 'ARTERRA';
    }
  }

  if (!from && body.trackToken) {
    const { data: brief } = await supabaseAdmin
      .from('briefs')
      .select('id, buyer_name')
      .eq('track_token', String(body.trackToken))
      .maybeSingle();
    if (brief && brief.id === commission.brief_id) from = brief.buyer_name;
  }

  if (!from) return NextResponse.json({ error: 'You cannot post to this commission.' }, { status: 403 });

  const { error } = await supabaseAdmin
    .from('commission_messages')
    .insert({ commission_id: commission.id, from_label: from, text });
  if (error) return NextResponse.json({ error: 'The message could not be saved.' }, { status: 500 });

  return NextResponse.json({ success: true });
}