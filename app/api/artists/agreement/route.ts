import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return false;
  const latest = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  return value >= '2020-01-01' && value <= latest;
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const artistId = String(body.artistId || '');
  if (!UUID.test(artistId)) return NextResponse.json({ error: 'Artist not found.' }, { status: 404 });

  const { data: artist } = await supabaseAdmin
    .from('artists').select('id').eq('id', artistId).maybeSingle();
  if (!artist) return NextResponse.json({ error: 'Artist not found.' }, { status: 404 });

  const signedOn = String(body.signedOn ?? '').trim();
  let update: Record<string, unknown>;

  if (!signedOn) {
    update = { agreement_signed_on: null, agreement_note: '' };
  } else {
    if (!validDate(signedOn)) {
      return NextResponse.json({ error: 'Choose a valid signing date that is not in the future.' }, { status: 400 });
    }
    update = {
      agreement_signed_on: signedOn,
      agreement_note: String(body.note ?? '').trim().slice(0, 200),
    };
  }

  const { error } = await supabaseAdmin.from('artists').update(update).eq('id', artist.id);
  if (error) return NextResponse.json({ error: 'It could not be saved. Has the agreements SQL been run?' }, { status: 500 });

  return NextResponse.json({ success: true });
}