import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'event-enquiries', 4, 3600)) {
    return NextResponse.json({ error: 'Too many enquiries. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const name = clean(body.name, 120);
  const contact = clean(body.contact, 200);
  const description = clean(body.description, 3000);
  if (!name || !contact || !description) {
    return NextResponse.json({ error: 'Please add your name, contact details and a description.' }, { status: 400 });
  }

  let groupSize: number | null = null;
  if (String(body.group_size ?? '').trim() !== '') {
    const n = Number(body.group_size);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      return NextResponse.json({ error: 'The group size must be between 1 and 1000.' }, { status: 400 });
    }
    groupSize = n;
  }

  const { error } = await supabaseAdmin.from('event_enquiries').insert({
    name,
    contact,
    organisation: clean(body.organisation, 160),
    group_size: groupSize,
    preferred_date: clean(body.preferred_date, 120),
    location: clean(body.location, 160),
    budget: clean(body.budget, 120),
    description,
    preferred_artist: clean(body.preferred_artist, 160),
  });
  if (error) {
    return NextResponse.json({ error: 'Your enquiry could not be saved. Please try again.' }, { status: 500 });
  }

  await notifyAdmin('New private-event enquiry', [
    `From: ${name}`,
    `Group size: ${groupSize ?? 'not given'}`,
    `Details: ${description.slice(0, 200)}`,
  ]);

  return NextResponse.json({ success: true });
}