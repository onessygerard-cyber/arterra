import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimited } from '@/lib/rate-limit';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  if (await rateLimited(request, 'inquiries', 10, 3600)) {
    return NextResponse.json({ error: 'Too many inquiries. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const artworkId = clean(body.artworkId, 64);
  const buyerName = clean(body.buyerName, 120);
  const buyerContact = clean(body.buyerContact, 200);
  const message = clean(body.message, 2000);
  if (!artworkId || !buyerName || !buyerContact) {
    return NextResponse.json({ error: 'Please add your name and contact details.' }, { status: 400 });
  }

  const { data: artwork } = await supabaseAdmin
    .from('artworks')
    .select('id, title, status')
    .eq('id', artworkId)
    .maybeSingle();
  if (!artwork || artwork.status !== 'approved') {
    return NextResponse.json({ error: 'That piece is not available.' }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from('artwork_inquiries').insert({
    artwork_id: artwork.id,
    buyer_name: buyerName,
    buyer_contact: buyerContact,
    message,
    status: 'new',
  });
  if (error) return NextResponse.json({ error: 'We could not send that. Please try again.' }, { status: 500 });

  await notifyAdmin('New artwork inquiry', [
    `Piece: ${artwork.title}`,
    `From: ${buyerName}`,
    `Message: ${message.slice(0, 200) || 'none'}`,
  ]);

  return NextResponse.json({ success: true });
}