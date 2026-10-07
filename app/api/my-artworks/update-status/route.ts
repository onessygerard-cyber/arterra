import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const body = await request.json();
  const { artworkId, status } = body;

  if (!['approved', 'sold'].includes(status)) {
    return NextResponse.json({ error: 'Artists can only mark a piece as sold or available.' }, { status: 400 });
  }

  const { data: artist } = await supabaseAdmin
    .from('artists').select('id').eq('user_id', userData.user.id).maybeSingle();
  if (!artist) return NextResponse.json({ error: 'No linked artist profile' }, { status: 404 });

  const { data: artwork } = await supabaseAdmin
    .from('artworks').select('id, status, artist_id').eq('id', artworkId).maybeSingle();
  if (!artwork || artwork.artist_id !== artist.id) {
    return NextResponse.json({ error: 'Not your artwork' }, { status: 403 });
  }
  if (artwork.status === 'pending') {
    return NextResponse.json({ error: 'This piece is still awaiting approval.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('artworks').update({ status }).eq('id', artworkId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}