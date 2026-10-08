import { supabaseAdmin } from '@/lib/supabase-admin';
import { signReferenceImages } from '@/lib/signed-urls';
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

  const { data: commissions, error } = await supabaseAdmin
    .from('commissions')
    .select('*, briefs(buyer_name, buyer_contact, description, reference_images), commission_messages(id, from_label, text, created_at)')
    .eq('artist_id', artist.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withImages = await Promise.all(
    (commissions || []).map(async (c: { briefs?: { reference_images?: string[] | null } | null }) => ({
      ...c,
      reference_urls: await signReferenceImages(c.briefs?.reference_images),
    }))
  );

  return NextResponse.json({ commissions: withImages });
}