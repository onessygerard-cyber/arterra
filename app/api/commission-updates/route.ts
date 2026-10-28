import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireArtist } from '@/lib/require-artist';
import { rateLimited } from '@/lib/rate-limit';
import { isStage, STAGE_LABEL } from '@/lib/stages';
import { NextResponse } from 'next/server';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_UPDATES = 20;

export async function POST(request: Request) {
  const auth = await requireArtist(request);
  if (!auth) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  if (await rateLimited(request, 'commission-updates', 20, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
  }

  const form = await request.formData();
  const commissionId = String(form.get('commissionId') || '');
  const caption = String(form.get('caption') || '').trim().slice(0, 300);
  const stageRaw = String(form.get('stage') || '');
  const file = form.get('file') as File | null;

  if (!commissionId || !file) {
    return NextResponse.json({ error: 'Choose a photo first.' }, { status: 400 });
  }
  if (!isStage(stageRaw)) {
    return NextResponse.json({ error: 'Choose what kind of photo this is.' }, { status: 400 });
  }
  const stage = stageRaw;

  const { data: commission } = await supabaseAdmin
    .from('commissions')
    .select('id, artist_id, status')
    .eq('id', commissionId)
    .maybeSingle();
  if (!commission || commission.artist_id !== auth.artist.id) {
    return NextResponse.json({ error: 'Commission not found.' }, { status: 404 });
  }
  if (commission.status === 'proposed') {
    return NextResponse.json(
      { error: 'Progress photos can be added once ARTERRA has marked the deposit as paid.' },
      { status: 400 }
    );
  }
  if (commission.status === 'delivered') {
    return NextResponse.json({ error: 'This commission is complete.' }, { status: 400 });
  }

  const { count } = await supabaseAdmin
    .from('commission_updates')
    .select('id', { count: 'exact', head: true })
    .eq('commission_id', commission.id);
  if ((count ?? 0) >= MAX_UPDATES) {
    return NextResponse.json({ error: `You can add up to ${MAX_UPDATES} photos per commission.` }, { status: 400 });
  }

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please use a JPG, PNG or WebP image.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'The image must be under 4 MB.' }, { status: 400 });

  const path = `updates/${commission.id}/${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 12)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from('brief-references')
    .upload(path, buffer, { contentType: file.type });
  if (uploadError) return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });

  const { error } = await supabaseAdmin
    .from('commission_updates')
    .insert({ commission_id: commission.id, image_path: path, caption, stage });
  if (error) {
    await supabaseAdmin.storage.from('brief-references').remove([path]);
    return NextResponse.json({ error: 'The photo could not be saved.' }, { status: 500 });
  }

  const what =
    stage === 'update' ? 'Added a progress photo' : `Added the ${STAGE_LABEL[stage].toLowerCase()} for review`;
  await supabaseAdmin.from('commission_messages').insert({
    commission_id: commission.id,
    from_label: auth.artist.name,
    text: caption ? `${what}: ${caption}` : `${what}.`,
  });

  return NextResponse.json({ success: true });
}