import { supabaseAdmin } from '@/lib/supabase-admin';
import { signPaths } from '@/lib/signed-urls';

export type PublicUpdate = {
  id: string;
  url: string;
  caption: string;
  decision: string;
  buyer_comment: string;
  created_at: string;
};

type Row = {
  id: string;
  commission_id: string;
  image_path: string;
  caption: string;
  decision: string;
  buyer_comment: string;
  created_at: string;
};

export async function loadUpdates(commissionIds: string[]): Promise<Record<string, PublicUpdate[]>> {
  const result: Record<string, PublicUpdate[]> = {};
  if (commissionIds.length === 0) return result;

  const { data } = await supabaseAdmin
    .from('commission_updates')
    .select('id, commission_id, image_path, caption, decision, buyer_comment, created_at')
    .in('commission_id', commissionIds)
    .order('created_at', { ascending: true });

  const rows = (data || []) as Row[];
  const urls = await signPaths(rows.map(r => r.image_path));

  for (const r of rows) {
    if (!result[r.commission_id]) result[r.commission_id] = [];
    result[r.commission_id].push({
      id: r.id,
      url: urls[r.image_path] || '',
      caption: r.caption,
      decision: r.decision,
      buyer_comment: r.buyer_comment,
      created_at: r.created_at,
    });
  }
  return result;
}