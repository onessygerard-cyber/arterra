import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { readBoolSetting, REQUIRE_SIGNED_AGREEMENT } from '@/lib/settings';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const briefId = String(body.briefId || '');
  const artistId = String(body.artistId || '');
  const price = clean(body.price, 60);
  const timeline = clean(body.timeline, 80);

  if (!UUID.test(briefId) || !UUID.test(artistId)) {
    return NextResponse.json({ error: 'Choose a request and an artist.' }, { status: 400 });
  }
  if (!price || !timeline) {
    return NextResponse.json({ error: 'Add a price and a timeline.' }, { status: 400 });
  }

  const { data: brief } = await supabaseAdmin
    .from('briefs').select('id').eq('id', briefId).maybeSingle();
  if (!brief) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('id, name, status, agreement_signed_on')
    .eq('id', artistId)
    .maybeSingle();
  if (artistError) {
    return NextResponse.json({ error: 'Something went wrong. Has the agreements SQL been run?' }, { status: 500 });
  }
  if (!artist || artist.status !== 'verified') {
    return NextResponse.json({ error: 'That artist is not verified.' }, { status: 400 });
  }

  const rule = await readBoolSetting(REQUIRE_SIGNED_AGREEMENT);
  if (rule.value && !artist.agreement_signed_on) {
    return NextResponse.json(
      {
        error: `${artist.name} has not signed the Artist Marketplace Agreement yet. Record the signature under Artist agreements first, or turn the rule off.`,
      },
      { status: 400 }
    );
  }

  const { data: duplicate } = await supabaseAdmin
    .from('commissions')
    .select('id')
    .eq('brief_id', brief.id)
    .eq('artist_id', artist.id)
    .limit(1);
  if (duplicate && duplicate.length > 0) {
    return NextResponse.json({ error: 'This request is already matched with that artist.' }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .from('commissions')
    .insert({ brief_id: brief.id, artist_id: artist.id, price, timeline, status: 'proposed' });
  if (error) {
    return NextResponse.json({ error: 'The commission could not be created.' }, { status: 500 });
  }

  await supabaseAdmin.from('briefs').update({ status: 'matched' }).eq('id', brief.id);

  return NextResponse.json({ success: true });
}