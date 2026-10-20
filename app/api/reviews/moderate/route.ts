import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reviewId = String(body.reviewId || '');
  const action = String(body.action || '');
  if (!UUID.test(reviewId)) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

  if (action === 'delete') {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action !== 'hide' && action !== 'publish') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ status: action === 'hide' ? 'hidden' : 'published' })
    .eq('id', reviewId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}