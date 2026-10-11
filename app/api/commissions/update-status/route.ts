import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { error } = await supabaseAdmin
    .from('commissions')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.commissionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const ALLOWED = ['proposed', 'deposit_paid', 'in_progress', 'review', 'shipped', 'delivered'];

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const body = await request.json();
  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('commissions')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', body.commissionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}