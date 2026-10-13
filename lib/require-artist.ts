import { supabaseAdmin } from '@/lib/supabase-admin';

export async function requireArtist(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: artist } = await supabaseAdmin
    .from('artists')
    .select('id, name, status')
    .eq('user_id', data.user.id)
    .eq('status', 'verified')
    .maybeSingle();

  if (!artist) return null;
  return { user: data.user, artist };
}