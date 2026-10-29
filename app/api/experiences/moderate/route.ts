import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/require-admin';
import { todayIso } from '@/lib/experiences';
import { NextResponse } from 'next/server';

const RULES: Record<string, { from: string[]; to: string }> = {
  publish: { from: ['pending', 'rejected'], to: 'published' },
  reject: { from: ['pending'], to: 'rejected' },
  cancel: { from: ['pending', 'published'], to: 'cancelled' },
  complete: { from: ['published'], to: 'completed' },
  restore: { from: ['rejected', 'cancelled'], to: 'pending' },
};

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rule = RULES[String(body.action || '')];
  if (!rule) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const { data: experience } = await supabaseAdmin
    .from('experiences')
    .select('id, status, event_date')
    .eq('id', String(body.experienceId || ''))
    .maybeSingle();
  if (!experience) return NextResponse.json({ error: 'Experience not found.' }, { status: 404 });
  if (!rule.from.includes(experience.status)) {
    return NextResponse.json({ error: 'That action is not available for this experience.' }, { status: 400 });
  }
  if (body.action === 'publish' && experience.event_date < todayIso()) {
    return NextResponse.json({ error: 'The date has already passed, so this cannot be published.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('experiences').update({ status: rule.to }).eq('id', experience.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}