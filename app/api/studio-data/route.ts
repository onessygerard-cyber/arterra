import { supabaseAdmin } from '@/lib/supabase-admin';
import { signReferenceImages } from '@/lib/signed-urls';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: rawBriefs } = await supabaseAdmin.from('briefs').select('*').eq('status', 'new');
  const newBriefs = await Promise.all(
    (rawBriefs || []).map(async (b: { reference_images?: string[] | null }) => ({
      ...b,
      reference_urls: await signReferenceImages(b.reference_images),
    }))
  );

  const { data: pendingArtists } = await supabaseAdmin.from('artists').select('*').eq('status', 'pending');
  const { data: verifiedArtists } = await supabaseAdmin.from('artists').select('*').eq('status', 'verified');
  const { data: commissions } = await supabaseAdmin
    .from('commissions')
    .select('*, briefs(buyer_name, buyer_contact, description, track_token), artists(name, contact)')
    .order('updated_at', { ascending: false });
  const { data: pendingArtworks } = await supabaseAdmin
    .from('artworks')
    .select('*, artists(name)')
    .eq('status', 'pending');
  const { data: liveArtworks } = await supabaseAdmin
    .from('artworks')
    .select('*, artists(name)')
    .in('status', ['approved', 'sold']);
  const { data: inquiries } = await supabaseAdmin
    .from('artwork_inquiries')
    .select('*, artworks(title, artists(name))')
    .order('created_at', { ascending: false });

  return NextResponse.json({ newBriefs, pendingArtists, verifiedArtists, commissions, pendingArtworks, liveArtworks, inquiries });
}