import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const commissionId = String(body.commissionId || '');
  const price = String(body.price || '').trim().slice(0, 60);
  const timeline = String(body.timeline || '').trim().slice(0, 80);
  if (!commissionId || !price || !timeline) {
    return NextResponse.json({ error: 'Add a price and a timeline.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('commissions')
    .select('price, timeline')
    .eq('id', commissionId)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Commission not found.' }, { status: 404 });

  const { error } = await supabaseAdmin
    .from('commissions')
    .update({ price, timeline, updated_at: new Date().toISOString() })
    .eq('id', commissionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing.price !== price || existing.timeline !== timeline) {
    await supabaseAdmin.from('commission_messages').insert({
      commission_id: commissionId,
      from_label: 'ARTERRA',
      text: `The terms were updated to ${price}, ${timeline} (previously ${existing.price}, ${existing.timeline}).`,
    });
  }

  return NextResponse.json({ success: true });
}