import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('briefs')
    .insert({
      buyer_name: body.buyerName,
      buyer_contact: body.buyerContact,
      description: body.description,
      medium: body.medium,
      style: body.style,
      size: body.size,
      budget: body.budget,
      deadline: body.deadline || null,
      location: body.location,
      notes: body.notes,
      reference_images: Array.isArray(body.referenceImages)
        ? body.referenceImages.filter((p: unknown) => typeof p === 'string').slice(0, 4)
        : [],
      status: 'new'
    })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, brief: data[0] });
}