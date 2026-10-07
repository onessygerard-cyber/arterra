import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const { data: artist } = await supabaseAdmin
    .from('artists').select('*').eq('user_id', userData.user.id).maybeSingle();

  if (!artist) return NextResponse.json({ error: 'No linked artist profile' }, { status: 404 });

  const { data: artworks } = await supabaseAdmin
    .from('artworks').select('*').eq('artist_id', artist.id).order('created_at', { ascending: false });

  return NextResponse.json({ artist, artworks: artworks || [] });
}