import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('artists')
    .insert({
      name: body.name,
      contact: body.contact,
      mediums: body.mediums,
      styles: body.styles,
      location: body.location,
      ships_to: body.shipsTo,
      price_range: body.priceRange,
      turnaround: body.turnaround,
      bio: body.bio,
      portfolio: body.portfolio,
      status: 'pending'
    })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, artist: data[0] });
}