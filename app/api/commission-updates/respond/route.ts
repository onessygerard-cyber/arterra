import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (await rateLimited(request, 'update-response', 30, 600)) {
    return NextResponse.json({ error: 'Too many responses. Please wait a few minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.trackToken || '');
  const updateId = String(body.updateId || '');
  const decision = String(body.decision || '');
  const comment = String(body.comment || '').trim().slice(0, 1000);

  if (!UUID.test(token) || !UUID.test(updateId)) {
    return NextResponse.json({ error: 'That request is not valid.' }, { status: 400 });
  }
  if (decision !== 'approved' && decision !== 'changes_requested') {
    return NextResponse.json({ error: 'That request is not valid.' }, { status: 400 });
  }
  if (decision === 'changes_requested' && !comment) {
    return NextResponse.json({ error: 'Tell the artist what you would like changed.' }, { status: 400 });
  }

  const { data: brief } = await supabaseAdmin
    .from('briefs').select('id, buyer_name').eq('track_token', token).maybeSingle();
  if (!brief) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  const { data: update } = await supabaseAdmin
    .from('commission_updates').select('id, caption, commission_id').eq('id', updateId).maybeSingle();
  if (!update) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });

  const { data: commission } = await supabaseAdmin
    .from('commissions').select('id, brief_id, status').eq('id', update.commission_id).maybeSingle();
  if (!commission || commission.brief_id !== brief.id) {
    return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
  }
  if (commission.status === 'delivered') {
    return NextResponse.json({ error: 'This commission is complete.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('commission_updates')
    .update({ decision, buyer_comment: comment, decided_at: new Date().toISOString() })
    .eq('id', update.id);
  if (error) return NextResponse.json({ error: 'Your response could not be saved.' }, { status: 500 });

  const label = update.caption ? ` "${update.caption}"` : '';
  const text =
    decision === 'approved'
      ? `Approved the progress photo${label}.${comment ? ` Note: ${comment}` : ''}`
      : `Asked for changes on the progress photo${label}: ${comment}`;
  await supabaseAdmin.from('commission_messages').insert({
    commission_id: commission.id,
    from_label: brief.buyer_name,
    text: text.slice(0, 2000),
  });

  return NextResponse.json({ success: true });
}