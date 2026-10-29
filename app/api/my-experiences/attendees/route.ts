import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'Experience not found.' }, { status: 404 });

  const { data: exp } = await supabaseAdmin
    .from('experiences')
    .select('id, artist_id, capacity, min_attendees')
    .eq('id', id)
    .maybeSingle();
  if (!exp || exp.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Experience not found.' }, { status: 404 });
  }

  const { data } = await supabaseAdmin
    .from('experience_bookings')
    .select('name, seats')
    .eq('experience_id', exp.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: true });

  return NextResponse.json({
    attendees: data || [],
    capacity: exp.capacity,
    min: exp.min_attendees,
  });
}