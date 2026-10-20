import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { notifyAdmin } from '@/lib/notify';
import { NextResponse } from 'next/server';

const LISTING_TYPES = ['original', 'print'];
const FRAMED = ['', 'unframed', 'stretched', 'framed'];
const EDITABLE = ['pending', 'approved', 'sold', 'rejected'];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { data: artwork } = await supabaseAdmin
    .from('artworks')
    .select('id, artist_id, status')
    .eq('id', String(body.artworkId || ''))
    .maybeSingle();

  if (!artwork || artwork.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Piece not found.' }, { status: 404 });
  }
  if (!EDITABLE.includes(artwork.status)) {
    return NextResponse.json(
      { error: 'This piece has been taken offline by ARTERRA. Please contact the team.' },
      { status: 400 }
    );
  }

  const title = clean(body.title, 200);
  if (!title) return NextResponse.json({ error: 'Add a title.' }, { status: 400 });

  const priceOnRequest = body.priceOnRequest === true;
  const price = priceOnRequest ? '' : clean(body.price, 60);
  if (!priceOnRequest && !price) {
    return NextResponse.json({ error: 'Add a price, or choose Price on request.' }, { status: 400 });
  }

  const resubmitted = artwork.status === 'rejected';
  const update: Record<string, unknown> = {
    title,
    description: clean(body.description, 2000),
    listing_type: LISTING_TYPES.includes(body.listingType) ? body.listingType : 'original',
    medium: clean(body.medium, 120),
    size: clean(body.size, 120),
    year: clean(body.year, 10),
    style: clean(body.style, 120),
    framed_status: FRAMED.includes(body.framedStatus) ? body.framedStatus : '',
    price,
    price_on_request: priceOnRequest,
  };
  if (resubmitted) update.status = 'pending';

  const { error } = await supabaseAdmin.from('artworks').update(update).eq('id', artwork.id);
  if (error) return NextResponse.json({ error: 'The changes could not be saved.' }, { status: 500 });

  if (resubmitted) {
    await notifyAdmin('Artwork resubmitted', [`Artist: ${auth.artist.name}`, `Title: ${title}`]);
  }
  return NextResponse.json({ success: true, resubmitted });
}