import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const MEDIUMS = [
  'Painting', 'Drawing', 'Portrait', 'Sculpture',
  'Photography', 'Textile / Fiber art', 'Ceramics', 'Mixed media',
];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'artists', 3, 3600)) {
    return NextResponse.json(
      { error: 'Too many applications from this connection. Please try again later.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = clean(body.name, 120);
  const contact = clean(body.contact, 200);
  const location = clean(body.location, 160);
  const priceRange = clean(body.priceRange, 80);
  const turnaround = clean(body.turnaround, 80);
  const bio = clean(body.bio, 3000);
  const portfolio = clean(body.portfolio, 3000);
  const mediums = Array.isArray(body.mediums)
    ? body.mediums.filter((m: unknown) => typeof m === 'string' && MEDIUMS.includes(m))
    : [];
  const styles = Array.isArray(body.styles)
    ? body.styles.map((s: unknown) => clean(s, 60)).filter(Boolean).slice(0, 10)
    : [];

  if (!name || !contact || !location || !priceRange || !turnaround || !bio || !portfolio || mediums.length === 0) {
    return NextResponse.json({ error: 'Please fill in every required field.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('artists').insert({
    name,
    contact,
    mediums,
    styles,
    location,
    ships_to: clean(body.shipsTo, 120),
    price_range: priceRange,
    turnaround,
    bio,
    portfolio,
    status: 'pending',
  });
  if (error) return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 });

  await notifyAdmin('New artist application', [
    `Name: ${name}`,
    `Location: ${location}`,
    `Art types: ${mediums.join(', ')}`,
  ]);

  return NextResponse.json({ success: true });
}