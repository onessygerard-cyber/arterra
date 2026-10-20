import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const REF_RE = /^\d{10,}-[a-f0-9]{12}\.(jpg|png|webp)$/;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'briefs', 5, 3600)) {
    return NextResponse.json(
      { error: 'Too many requests from this connection. Please try again in an hour.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const buyerName = clean(body.buyerName, 120);
  const buyerContact = clean(body.buyerContact, 200);
  const description = clean(body.description, 4000);
  if (!buyerName || !buyerContact || !description) {
    return NextResponse.json(
      { error: 'Please add your name, contact details and a description.' },
      { status: 400 }
    );
  }

  const deadlineRaw = clean(body.deadline, 10);
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) ? deadlineRaw : null;

  const referenceImages = Array.isArray(body.referenceImages)
    ? body.referenceImages.filter((p: unknown) => typeof p === 'string' && REF_RE.test(p)).slice(0, 4)
    : [];

  const { data, error } = await supabaseAdmin
    .from('briefs')
    .insert({
      buyer_name: buyerName,
      buyer_contact: buyerContact,
      description,
      medium: clean(body.medium, 60),
      style: clean(body.style, 60),
      size: clean(body.size, 120),
      budget: clean(body.budget, 120),
      deadline,
      location: clean(body.location, 160),
      notes: clean(body.notes, 2000),
      reference_images: referenceImages,
      status: 'new',
    })
    .select('track_token');

  if (error || !data?.[0]) {
    return NextResponse.json({ error: 'We could not save your request. Please try again.' }, { status: 500 });
  }

  await notifyAdmin('New commission brief', [
    `From: ${buyerName}`,
    `Type: ${clean(body.medium, 60)} / ${clean(body.style, 60)}`,
    `Budget: ${clean(body.budget, 120) || 'not given'}`,
    `Description: ${description.slice(0, 200)}`,
  ]);

  return NextResponse.json({ success: true, brief: { track_token: data[0].track_token } });
}