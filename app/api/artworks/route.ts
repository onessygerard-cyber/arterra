import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .insert({
      artist_id: body.artistId,
      title: body.title,
      description: body.description,
      listing_type: body.listingType,
      medium: body.medium,
      size: body.size,
      price: body.price,
      image_url: body.imageUrl,
      status: 'pending'
    })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, artwork: data[0] });
}