import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: experiences, error } = await supabaseAdmin
    .from('experiences')
    .select('*, artists(name, contact)')
    .order('event_date', { ascending: true })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (experiences || []).map((e: { id: string }) => e.id);
  let bookings: unknown[] = [];
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from('experience_bookings')
      .select('*')
      .in('experience_id', ids)
      .order('created_at', { ascending: true });
    bookings = data || [];
  }

  const { data: enquiries } = await supabaseAdmin
    .from('event_enquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ experiences: experiences || [], bookings, enquiries: enquiries || [] });
}