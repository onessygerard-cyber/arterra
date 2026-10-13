import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data) return null;
    const match = data.users.find(u => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const body = await request.json();
  const artistId = String(body.artistId || '');
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (email === adminEmail) {
    return NextResponse.json({ error: 'Use a different email for artist logins.' }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: 'The password must be at least 10 characters.' }, { status: 400 });
  }

  const { data: artist } = await supabaseAdmin
    .from('artists').select('id, user_id, status').eq('id', artistId).maybeSingle();
  if (!artist) return NextResponse.json({ error: 'Artist not found.' }, { status: 404 });
  if (artist.status !== 'verified') {
    return NextResponse.json({ error: 'Approve this artist first.' }, { status: 400 });
  }

  let userId: string | null = artist.user_id;

  if (userId) {
    const current = await supabaseAdmin.auth.admin.getUserById(userId);
    if (current.data?.user?.email?.toLowerCase() === adminEmail) {
      return NextResponse.json({ error: 'This artist is linked to the admin account.' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email, password, email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const created = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
    const createdId = created.data?.user?.id;

    if (createdId) {
      userId = createdId;
    } else {
      const existingId = await findUserIdByEmail(email);
      if (!existingId) {
        return NextResponse.json({ error: created.error?.message || 'Could not create the login.' }, { status: 500 });
      }
      const { data: owner } = await supabaseAdmin
        .from('artists').select('id').eq('user_id', existingId).maybeSingle();
      if (owner && owner.id !== artist.id) {
        return NextResponse.json({ error: 'That email already belongs to another artist.' }, { status: 409 });
      }
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existingId, {
        password, email_confirm: true,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      userId = existingId;
    }

    const { error: linkError } = await supabaseAdmin
      .from('artists').update({ user_id: userId }).eq('id', artist.id);
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}