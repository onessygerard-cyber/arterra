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

  return NextResponse.json({ newBriefs, pendingArtists, verifiedArtists, commissions });
}