import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

const ALLOWED = ['pending', 'approved', 'sold', 'rejected', 'hidden'];

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (!ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const update =
    body.status === 'approved'
      ? { status: body.status }
      : { status: body.status, is_featured: false };

  const { error } = await supabaseAdmin
    .from('artworks')
    .update(update)
    .eq('id', String(body.artworkId || ''));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/');
  return NextResponse.json({ success: true });
}