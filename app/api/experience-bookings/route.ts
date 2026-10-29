import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { confirmedSeats } from '@/lib/experience-seats';
import { todayIso } from '@/lib/experiences';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function likeEscape(value: string): string {
  return value.replace(/[\\%_]/g, ch => `\\${ch}`);
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'experience-bookings', 6, 3600)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const experienceId = String(body.experienceId || '');
  const name = clean(body.name, 120);
  const contact = clean(body.contact, 200);
  const message = clean(body.message, 1000);
  const seats = Number(body.seats);

  if (!UUID.test(experienceId)) {
    return NextResponse.json({ error: 'This experience is not open for reservations.' }, { status: 404 });
  }
  if (!name || !contact) {
    return NextResponse.json({ error: 'Please add your name and contact details.' }, { status: 400 });
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
    return NextResponse.json({ error: 'Choose between 1 and 10 seats.' }, { status: 400 });
  }

  const { data: experience } = await supabaseAdmin
    .from('experiences')
    .select('id, title, status, event_date, capacity, artists!inner(status)')
    .eq('id', experienceId)
    .eq('artists.status', 'verified')
    .maybeSingle();

  if (!experience || experience.status !== 'published' || experience.event_date < todayIso()) {
    return NextResponse.json({ error: 'This experience is not open for reservations.' }, { status: 400 });
  }
  if (seats > experience.capacity) {
    return NextResponse.json({ error: `This experience has ${experience.capacity} seats in total.` }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('experience_bookings')
    .select('id')
    .eq('experience_id', experience.id)
    .ilike('contact', likeEscape(contact))
    .in('status', ['requested', 'confirmed', 'waitlist'])
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'You already have a reservation for this experience. Use your private link, or contact ARTERRA.' },
      { status: 409 }
    );
  }

  const taken = await confirmedSeats(experience.id);
  const status = taken + seats > experience.capacity ? 'waitlist' : 'requested';

  const { data, error } = await supabaseAdmin
    .from('experience_bookings')
    .insert({ experience_id: experience.id, name, contact, seats, message, status })
    .select('booking_token');
  if (error || !data?.[0]) {
    return NextResponse.json({ error: 'Your request could not be saved. Please try again.' }, { status: 500 });
  }

  await notifyAdmin(status === 'waitlist' ? 'New waiting-list request' : 'New experience reservation request', [
    `Experience: ${experience.title}`,
    `From: ${name}`,
    `Seats: ${seats}`,
  ]);

  return NextResponse.json({ success: true, status, token: data[0].booking_token });
}