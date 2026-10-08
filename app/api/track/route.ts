import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const { data: brief, error: briefError } = await supabaseAdmin
    .from('briefs').select('*').eq('track_token', token).maybeSingle();

  if (briefError) return NextResponse.json({ error: briefError.message }, { status: 500 });
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: commissions, error } = await supabaseAdmin
    .from('commissions')
    .select('*, artists(name, contact), commission_messages(id, from_label, text, created_at)')
    .eq('brief_id', brief.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brief, commissions: commissions || [] });
}