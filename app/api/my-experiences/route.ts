import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { LOCKED_WHEN_LIVE, parseExperience } from '@/lib/experiences';
import { NextResponse } from 'next/server';

function imagePrefix(artistId: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/artwork-images/${artistId}/`;
}

export async function GET(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('experiences')
    .select('*')
    .eq('artist_id', auth.artist.id)
    .order('event_date', { ascending: false });
  if (error) return NextResponse.json({ error: 'Your experiences could not be loaded.' }, { status: 500 });

  return NextResponse.json({ experiences: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  if (await rateLimited(request, 'experiences', 15, 3600)) {
    return NextResponse.json({ error: 'Too many changes. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '');

  if (!id) {
    const parsed = parseExperience(body, imagePrefix(auth.artist.id), true);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('experiences')
      .insert({ ...parsed.fields, artist_id: auth.artist.id, status: 'pending' });
    if (error) return NextResponse.json({ error: 'The experience could not be saved.' }, { status: 500 });

    await notifyAdmin('New experience submitted', [
      `Host: ${auth.artist.name}`,
      `Title: ${parsed.fields.title}`,
      `Date: ${parsed.fields.event_date}`,
    ]);
    return NextResponse.json({ success: true });
  }

  const { data: existing } = await supabaseAdmin
    .from('experiences').select('*').eq('id', id).maybeSingle();
  if (!existing || existing.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Experience not found.' }, { status: 404 });
  }
  if (!['pending', 'rejected', 'published'].includes(existing.status)) {
    return NextResponse.json({ error: 'This experience can no longer be edited.' }, { status: 400 });
  }

  const live = existing.status === 'published';
  const parsed = parseExperience(body, imagePrefix(auth.artist.id), !live);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const f = parsed.fields;

  if (live) {
    const changed = LOCKED_WHEN_LIVE.filter(key => {
      const before = key === 'start_time' ? String(existing.start_time || '').slice(0, 5) : String(existing[key]);
      return before !== String(f[key]);
    });
    if (changed.length > 0) {
      return NextResponse.json(
        {
          error:
            'The title, date, time, place, price and seats cannot be changed once an experience is live. Contact ARTERRA to change them.',
        },
        { status: 400 }
      );
    }
    const { error } = await supabaseAdmin
      .from('experiences')
      .update({
        description: f.description,
        includes: f.includes,
        bring: f.bring,
        private_details: f.private_details,
        image_url: f.image_url,
      })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: 'The changes could not be saved.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const resubmitted = existing.status === 'rejected';
  const { error } = await supabaseAdmin
    .from('experiences')
    .update({ ...f, status: resubmitted ? 'pending' : existing.status })
    .eq('id', existing.id);
  if (error) return NextResponse.json({ error: 'The changes could not be saved.' }, { status: 500 });

  if (resubmitted) {
    await notifyAdmin('Experience resubmitted', [`Host: ${auth.artist.name}`, `Title: ${f.title}`]);
  }
  return NextResponse.json({ success: true });
}