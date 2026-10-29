import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { REQUIRE_SIGNED_AGREEMENT } from '@/lib/settings';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const required = body.required === true;

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert(
      { key: REQUIRE_SIGNED_AGREEMENT, bool_value: required, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  if (error) {
    return NextResponse.json({ error: 'The rule could not be saved. Has the agreements SQL been run?' }, { status: 500 });
  }

  return NextResponse.json({ success: true, required });
}