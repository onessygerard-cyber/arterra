import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact = searchParams.get('contact')?.trim().toLowerCase();
  if (!contact) return NextResponse.json({ error: 'Missing contact' }, { status: 400 });

  const { data: myArtist } = await supabaseAdmin
    .from('artists').select('id').ilike('contact', contact).maybeSingle();

  const { data: myBriefs } = await supabaseAdmin
    .from('briefs').select('id').ilike('buyer_contact', contact);
  const briefIds = (myBriefs || []).map(b => b.id);

  const conditions: string[] = [];
  if (myArtist) conditions.push(`artist_id.eq.${myArtist.id}`);
  if (briefIds.length) conditions.push(`brief_id.in.(${briefIds.join(',')})`);

  if (conditions.length === 0) {
    return NextResponse.json({ commissions: [] });
  }

  const { data: commissions, error } = await supabaseAdmin
    .from('commissions')
    .select('*, briefs(buyer_name, buyer_contact, description), artists(name, contact), commission_messages(id, from_label, text, created_at)')
    .or(conditions.join(','));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commissions });
}