import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { NextResponse } from 'next/server';

const LISTING_TYPES = ['original', 'print'];
const FRAMED = ['', 'unframed', 'stretched', 'framed'];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json();
  const title = clean(body.title, 200);
  if (!title) return NextResponse.json({ error: 'Add a title.' }, { status: 400 });

  const imageUrl = clean(body.imageUrl, 1000);
  const allowedPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/artwork-images/`;
  if (!imageUrl.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'The image is not valid. Please upload it again.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .insert({
      artist_id: auth.artist.id,
      title,
      description: clean(body.description, 2000),
      listing_type: LISTING_TYPES.includes(body.listingType) ? body.listingType : 'original',
      medium: clean(body.medium, 120),
      size: clean(body.size, 120),
      price: clean(body.price, 60),
      year: clean(body.year, 10),
      style: clean(body.style, 120),
      framed_status: FRAMED.includes(body.framedStatus) ? body.framedStatus : '',
      image_url: imageUrl,
      status: 'pending',
    })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, artwork: data[0] });
}