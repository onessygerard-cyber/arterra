import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function displayName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A buyer';
  const first = parts[0].slice(0, 30);
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : '';
  return first + last;
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'reviews', 5, 3600)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.trackToken || '');
  const commissionId = String(body.commissionId || '');
  const rating = Number(body.rating);
  const text = String(body.body || '').trim().slice(0, 2000);

  if (!UUID.test(token) || !UUID.test(commissionId)) {
    return NextResponse.json({ error: 'That request is not valid.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Choose a rating from 1 to 5 stars.' }, { status: 400 });
  }

  const { data: brief } = await supabaseAdmin
    .from('briefs').select('id, buyer_name').eq('track_token', token).maybeSingle();
  if (!brief) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  const { data: commission } = await supabaseAdmin
    .from('commissions').select('id, brief_id, artist_id, status').eq('id', commissionId).maybeSingle();
  if (!commission || commission.brief_id !== brief.id) {
    return NextResponse.json({ error: 'Commission not found.' }, { status: 404 });
  }
  if (commission.status !== 'delivered') {
    return NextResponse.json({ error: 'You can review a commission once it has been delivered.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('reviews').insert({
    commission_id: commission.id,
    artist_id: commission.artist_id,
    rating,
    body: text,
    display_name: displayName(brief.buyer_name),
  });
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this commission.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Your review could not be saved.' }, { status: 500 });
  }

  await notifyAdmin('New review', [
    `Rating: ${rating} out of 5`,
    text ? `Review: ${text.slice(0, 200)}` : 'No written review',
  ]);

  return NextResponse.json({ success: true });
}