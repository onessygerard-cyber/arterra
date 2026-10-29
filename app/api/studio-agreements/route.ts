import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { readBoolSetting, REQUIRE_SIGNED_AGREEMENT } from '@/lib/settings';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: artists, error } = await supabaseAdmin
    .from('artists')
    .select('id, name, contact, agreement_signed_on, agreement_note')
    .eq('status', 'verified')
    .order('name');
  if (error) {
    return NextResponse.json({ error: 'The artists could not be loaded. Has the agreements SQL been run?' }, { status: 500 });
  }

  const setting = await readBoolSetting(REQUIRE_SIGNED_AGREEMENT);
  return NextResponse.json({
    artists: artists || [],
    required: setting.value,
    settingAvailable: setting.available,
  });
}