import { supabaseAdmin } from '@/lib/supabase-admin';
import { todayIso } from '@/lib/experiences';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Exp = {
  id: string;
  title: string;
  status: string;
  event_date: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  format: string;
  price: string;
  private_details: string;
  artists: { name: string } | null;
};

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!UUID.test(token)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: booking } = await supabaseAdmin
    .from('experience_bookings')
    .select(
      'name, seats, status, admin_note, experiences(id, title, status, event_date, start_time, duration_minutes, location, format, price, private_details, artists(name))'
    )
    .eq('booking_token', token)
    .maybeSingle();

  const exp = booking?.experiences as unknown as Exp | null;
  if (!booking || !exp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const finished = exp.status === 'completed' || exp.event_date < todayIso();
  const showPrivate = booking.status === 'confirmed' && exp.status === 'published';

  return NextResponse.json({
    booking: {
      name: booking.name,
      seats: booking.seats,
      status: booking.status,
      admin_note: booking.admin_note,
    },
    experience: {
      id: exp.id,
      title: exp.title,
      status: exp.status,
      finished,
      event_date: exp.event_date,
      start_time: exp.start_time,
      duration_minutes: exp.duration_minutes,
      location: exp.location,
      format: exp.format,
      price: exp.price,
      host: exp.artists?.name ?? null,
      private_details: showPrivate ? exp.private_details : null,
    },
  });
}