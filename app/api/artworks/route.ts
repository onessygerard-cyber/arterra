import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const LISTING_TYPES = ['original', 'print'];
const FRAMED = ['', 'unframed', 'stretched', 'framed'];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function dimension(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 16 && n <= 20000 ? n : null;
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const title = clean(body.title, 200);
  if (!title) return NextResponse.json({ error: 'Add a title.' }, { status: 400 });

  const priceOnRequest = body.priceOnRequest === true;
  const price = priceOnRequest ? '' : clean(body.price, 60);
  if (!priceOnRequest && !price) {
    return NextResponse.json({ error: 'Add a price, or choose Price on request.' }, { status: 400 });
  }

  const imageUrl = clean(body.imageUrl, 1000);
  const allowedPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/artwork-images/${auth.artist.id}/`;
  if (!imageUrl.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'The image is not valid. Please upload it again.' }, { status: 400 });
  }

  const width = dimension(body.imageWidth);
  const height = dimension(body.imageHeight);
  const hasSize = width !== null && height !== null;

  const { data, error } = await supabaseAdmin
    .from('artworks')
    .insert({
      artist_id: auth.artist.id,
      title,
      description: clean(body.description, 2000),
      listing_type: LISTING_TYPES.includes(body.listingType) ? body.listingType : 'original',
      medium: clean(body.medium, 120),
      size: clean(body.size, 120),
      price,
      price_on_request: priceOnRequest,
      year: clean(body.year, 10),
      style: clean(body.style, 120),
      framed_status: FRAMED.includes(body.framedStatus) ? body.framedStatus : '',
      image_url: imageUrl,
      image_width: hasSize ? width : null,
      image_height: hasSize ? height : null,
      status: 'pending',
    })
    .select();

  if (error) return NextResponse.json({ error: 'The piece could not be saved. Please try again.' }, { status: 500 });

  await notifyAdmin('New artwork submission', [`Artist: ${auth.artist.name}`, `Title: ${title}`]);
  return NextResponse.json({ success: true, artwork: data[0] });
}