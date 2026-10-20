import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { signPaths } from '@/lib/signed-urls';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('*, artists(name)')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: rawUpdates } = await supabaseAdmin
    .from('commission_updates')
    .select('*, commissions(briefs(buyer_name), artists(name))')
    .order('created_at', { ascending: false })
    .limit(60);

  const urls = await signPaths((rawUpdates || []).map((u: { image_path: string }) => u.image_path));
  const updates = (rawUpdates || []).map((u: { image_path: string }) => ({
    ...u,
    url: urls[u.image_path] || '',
  }));

  return NextResponse.json({ reviews: reviews || [], updates });
}