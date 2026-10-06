import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact = searchParams.get('contact')?.trim().toLowerCase();
  if (!contact) return NextResponse.json({ error: 'Missing contact' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('artists')
    .select('id, name, status')
    .ilike('contact', contact)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ found: false });
  if (data.status !== 'verified') return NextResponse.json({ found: false, notVerified: true });

  return NextResponse.json({ found: true, artist: data });
}