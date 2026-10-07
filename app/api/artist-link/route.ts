import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user?.email) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const email = userData.user.email.toLowerCase();

  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('*')
    .ilike('contact', email)
    .eq('status', 'verified')
    .maybeSingle();

  if (artistError) return NextResponse.json({ error: artistError.message }, { status: 500 });
  if (!artist) return NextResponse.json({ error: 'No verified artist found for this email' }, { status: 404 });

  if (!artist.user_id) {
    const { error: updateError } = await supabaseAdmin
      .from('artists')
      .update({ user_id: userData.user.id })
      .eq('id', artist.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, artist });
}