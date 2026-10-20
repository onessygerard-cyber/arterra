import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const ALLOWED = ['new', 'archived'];

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('briefs')
    .update({ status: body.status })
    .eq('id', String(body.briefId || ''));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}