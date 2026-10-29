import { supabaseAdmin } from '@/lib/supabase-admin';

export const REQUIRE_SIGNED_AGREEMENT = 'require_signed_agreement';

export async function readBoolSetting(key: string): Promise<{ value: boolean; available: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('bool_value')
    .eq('key', key)
    .maybeSingle();
  if (error) return { value: false, available: false };
  return { value: data?.bool_value === true, available: true };
}