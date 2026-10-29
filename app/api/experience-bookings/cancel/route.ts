import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (await rateLimited(request, 'booking-cancel', 10, 3600)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.token || '');
  if (!UUID.test(token)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: booking } = await supabaseAdmin
    .from('experience_bookings')
    .select('id, name, seats, status, experiences(title)')
    .eq('booking_token', token)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['requested', 'confirmed', 'waitlist'].includes(booking.status)) {
    return NextResponse.json({ error: 'This reservation cannot be cancelled.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('experience_bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', booking.id);
  if (error) return NextResponse.json({ error: 'It could not be cancelled. Please try again.' }, { status: 500 });

  const title = (booking.experiences as unknown as { title: string } | null)?.title ?? 'an experience';
  await notifyAdmin(
    booking.status === 'confirmed' ? 'A confirmed attendee cancelled' : 'A reservation request was cancelled',
    [`Experience: ${title}`, `Attendee: ${booking.name}`, `Seats: ${booking.seats}`]
  );

  return NextResponse.json({ success: true });
}