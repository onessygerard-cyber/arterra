import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { confirmedSeats } from '@/lib/experience-seats';
import { NextResponse } from 'next/server';

const ACTIONS = ['confirm', 'waitlist', 'decline', 'cancel', 'paid', 'unpaid', 'note'];

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');
  if (!ACTIONS.includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const { data: booking } = await supabaseAdmin
    .from('experience_bookings')
    .select('id, experience_id, seats, status')
    .eq('id', String(body.bookingId || ''))
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });

  let update: Record<string, unknown>;

  if (action === 'confirm') {
    if (!['requested', 'waitlist'].includes(booking.status)) {
      return NextResponse.json({ error: 'This reservation cannot be confirmed.' }, { status: 400 });
    }
    const { data: exp } = await supabaseAdmin
      .from('experiences').select('capacity, status').eq('id', booking.experience_id).maybeSingle();
    if (!exp || exp.status !== 'published') {
      return NextResponse.json({ error: 'Only live experiences can have confirmed places.' }, { status: 400 });
    }
    const taken = await confirmedSeats(booking.experience_id, booking.id);
    if (taken + booking.seats > exp.capacity) {
      return NextResponse.json(
        { error: `Only ${Math.max(0, exp.capacity - taken)} seats are left, so this cannot be confirmed.` },
        { status: 400 }
      );
    }
    update = { status: 'confirmed' };
  } else if (action === 'waitlist') {
    if (booking.status !== 'requested') {
      return NextResponse.json({ error: 'Only new requests can be moved to the waiting list.' }, { status: 400 });
    }
    update = { status: 'waitlist' };
  } else if (action === 'decline') {
    if (!['requested', 'waitlist'].includes(booking.status)) {
      return NextResponse.json({ error: 'This reservation cannot be declined.' }, { status: 400 });
    }
    update = { status: 'declined' };
  } else if (action === 'cancel') {
    if (!['requested', 'waitlist', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: 'This reservation cannot be cancelled.' }, { status: 400 });
    }
    update = { status: 'cancelled' };
  } else if (action === 'paid' || action === 'unpaid') {
    update = { paid: action === 'paid' };
  } else {
    update = { admin_note: String(body.note ?? '').trim().slice(0, 500) };
  }

  const { error } = await supabaseAdmin
    .from('experience_bookings')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', booking.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}