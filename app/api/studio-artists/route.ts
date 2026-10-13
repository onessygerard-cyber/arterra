import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: artists, error } = await supabaseAdmin
    .from('artists')
    .select('id, name, contact, user_id')
    .eq('status', 'verified')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = await Promise.all(
    (artists || []).map(async a => {
      let loginEmail: string | null = null;
      if (a.user_id) {
        const { data } = await supabaseAdmin.auth.admin.getUserById(a.user_id);
        loginEmail = data?.user?.email ?? null;
      }
      return { id: a.id, name: a.name, contact: a.contact, loginEmail };
    })
  );

  return NextResponse.json({ artists: rows });
}