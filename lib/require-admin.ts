import { supabaseAdmin } from '@/lib/supabase-admin';

export async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!token || !adminEmail) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null;
  if (data.user.email.toLowerCase() !== adminEmail) return null;
  return data.user;
}