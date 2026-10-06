import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { error } = await supabaseAdmin.from('artwork_inquiries').insert({
    artwork_id: body.artworkId,
    buyer_name: body.buyerName,
    buyer_contact: body.buyerContact,
    message: body.message,
    status: 'new'
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}