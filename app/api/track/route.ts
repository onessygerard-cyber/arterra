import { supabaseAdmin } from '@/lib/supabase-admin';
import { signReferenceImages } from '@/lib/signed-urls';
import { loadUpdates } from '@/lib/commission-updates';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || '';
  if (!UUID.test(token)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: brief, error: briefError } = await supabaseAdmin
    .from('briefs').select('*').eq('track_token', token).maybeSingle();
  if (briefError) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: rows, error } = await supabaseAdmin
    .from('commissions')
    .select('*, artists(name), commission_messages(id, from_label, text, created_at)')
    .eq('brief_id', brief.id);
  if (error) return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });

  const commissions = rows || [];
  const ids = commissions.map((c: { id: string }) => c.id);
  const updates = await loadUpdates(ids);

  let reviews: { commission_id: string; rating: number; body: string }[] = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from('reviews').select('commission_id, rating, body').in('commission_id', ids);
    reviews = data || [];
  }

  const merged = commissions.map((c: { id: string }) => {
    const review = reviews.find(r => r.commission_id === c.id);
    return {
      ...c,
      updates: updates[c.id] || [],
      review: review ? { rating: review.rating, body: review.body } : null,
    };
  });

  const reference_urls = await signReferenceImages(brief.reference_images);
  return NextResponse.json({ brief: { ...brief, reference_urls }, commissions: merged });
}