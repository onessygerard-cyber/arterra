import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { NextResponse } from 'next/server';

const MEDIUMS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture',
  'Photography', 'Textile / Fiber art', 'Ceramics', 'Mixed media',
];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const contact = clean(body.contact, 200);
  const location = clean(body.location, 160);
  const priceRange = clean(body.priceRange, 80);
  const turnaround = clean(body.turnaround, 80);
  const bio = clean(body.bio, 3000);
  const mediums = Array.isArray(body.mediums)
    ? body.mediums.filter((m: unknown) => typeof m === 'string' && MEDIUMS.includes(m))
    : [];
  const styles = Array.isArray(body.styles)
    ? body.styles.map((s: unknown) => clean(s, 60)).filter(Boolean).slice(0, 10)
    : [];

  if (!contact || !location || !priceRange || !turnaround || !bio || mediums.length === 0) {
    return NextResponse.json({ error: 'Please fill in every required field.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('artists')
    .update({
      contact,
      location,
      ships_to: clean(body.shipsTo, 120),
      price_range: priceRange,
      turnaround,
      bio,
      mediums,
      styles,
    })
    .eq('id', auth.artist.id);

  if (error) return NextResponse.json({ error: 'Your profile could not be saved.' }, { status: 500 });
  return NextResponse.json({ success: true });
}