import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data: experience } = await supabaseAdmin
    .from('experiences')
    .select('id, artist_id, status, title, event_date')
    .eq('id', String(body.id || ''))
    .maybeSingle();

  if (!experience || experience.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Experience not found.' }, { status: 404 });
  }
  if (!['pending', 'published'].includes(experience.status)) {
    return NextResponse.json({ error: 'This experience cannot be cancelled.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('experiences').update({ status: 'cancelled' }).eq('id', experience.id);
  if (error) return NextResponse.json({ error: 'It could not be cancelled.' }, { status: 500 });

  await notifyAdmin('Experience cancelled by its host', [
    `Host: ${auth.artist.name}`,
    `Title: ${experience.title}`,
    `Date: ${experience.event_date}`,
  ]);
  return NextResponse.json({ success: true });
}