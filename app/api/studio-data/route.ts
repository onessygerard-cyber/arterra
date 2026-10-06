import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: newBriefs } = await supabaseAdmin.from('briefs').select('*').eq('status', 'new');
  const { data: pendingArtists } = await supabaseAdmin.from('artists').select('*').eq('status', 'pending');
  const { data: verifiedArtists } = await supabaseAdmin.from('artists').select('*').eq('status', 'verified');
  const { data: commissions } = await supabaseAdmin
    .from('commissions')
    .select('*, briefs(buyer_name, buyer_contact, description), artists(name, contact)')
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

    return NextResponse.json({ newBriefs, pendingArtists, verifiedArtists, commissions, pendingArtworks, inquiries, liveArtworks });
}