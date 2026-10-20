import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { requireArtist } from '@/lib/require-artist';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const isAdmin = !!(await requireAdmin(request));
  const artistAuth = isAdmin ? null : await requireArtist(request);
  if (!isAdmin && !artistAuth) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const updateId = String(body.updateId || '');
  if (!UUID.test(updateId)) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });

  const { data: update } = await supabaseAdmin
    .from('commission_updates')
    .select('id, image_path, decision, commission_id')
    .eq('id', updateId)
    .maybeSingle();
  if (!update) return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });

  if (!isAdmin && artistAuth) {
    const { data: commission } = await supabaseAdmin
      .from('commissions').select('artist_id').eq('id', update.commission_id).maybeSingle();
    if (!commission || commission.artist_id !== artistAuth.artist.id) {
      return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
    }
    if (update.decision !== 'pending') {
      return NextResponse.json(
        { error: 'The buyer has already responded, so this photo can no longer be removed. Contact ARTERRA if it is a mistake.' },
        { status: 400 }
      );
    }
  }

  const { error } = await supabaseAdmin.from('commission_updates').delete().eq('id', update.id);
  if (error) return NextResponse.json({ error: 'The photo could not be removed.' }, { status: 500 });

  await supabaseAdmin.storage.from('brief-references').remove([update.image_path]);
  return NextResponse.json({ success: true });
}