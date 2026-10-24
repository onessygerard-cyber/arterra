import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const artworkId = String(body.artworkId || '');
  const featured = body.featured === true;

  if (featured) {
    const { data: artwork } = await supabaseAdmin
      .from('artworks').select('status').eq('id', artworkId).maybeSingle();
    if (!artwork || !['approved', 'sold'].includes(artwork.status)) {
      return NextResponse.json({ error: 'Only live pieces can be featured.' }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin
    .from('artworks').update({ is_featured: featured }).eq('id', artworkId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}