import { supabaseAdmin } from '@/lib/supabase-admin';
import { signReferenceImages } from '@/lib/signed-urls';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: rawBriefs } = await supabaseAdmin
    .from('briefs').select('*').eq('status', 'new').order('created_at', { ascending: false });
  const newBriefs = await Promise.all(
    (rawBriefs || []).map(async (b: { reference_images?: string[] | null }) => ({
      ...b,
      reference_urls: await signReferenceImages(b.reference_images),
    }))
  );

  const { data: pendingArtists } = await supabaseAdmin
    .from('artists').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  const { data: verifiedArtists } = await supabaseAdmin
    .from('artists').select('*').eq('status', 'verified').order('name');
  const { data: otherArtists } = await supabaseAdmin
    .from('artists').select('*').in('status', ['suspended', 'rejected']).order('created_at', { ascending: false });

  const { data: commissions } = await supabaseAdmin
    .from('commissions')
    .select('*, briefs(buyer_name, buyer_contact, description, track_token), artists(name, contact)')
    .order('updated_at', { ascending: false });

  const { data: pendingArtworks } = await supabaseAdmin
    .from('artworks').select('*, artists(name)').eq('status', 'pending').order('created_at', { ascending: false });
  const { data: liveArtworks } = await supabaseAdmin
    .from('artworks').select('*, artists(name)').in('status', ['approved', 'sold']).order('created_at', { ascending: false });
  const { data: offlineArtworks } = await supabaseAdmin
    .from('artworks').select('*, artists(name)').in('status', ['hidden', 'rejected']).order('created_at', { ascending: false });

  const { data: inquiries } = await supabaseAdmin
    .from('artwork_inquiries')
    .select('*, artworks(title, artists(name))')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    newBriefs, pendingArtists, verifiedArtists, otherArtists, commissions,
    pendingArtworks, liveArtworks, offlineArtworks, inquiries,
  });
}