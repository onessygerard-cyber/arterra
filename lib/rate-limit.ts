import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256')
    .update(ip + (process.env.RATE_LIMIT_SALT || 'arterra'))
    .digest('hex')
    .slice(0, 32);
}

export async function rateLimited(
  request: Request,
  name: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const bucket = `${name}:${clientKey(request)}`;
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('rate_events')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', bucket)
    .gte('created_at', since);

  if (error) return false;
  if ((count ?? 0) >= limit) return true;

  await supabaseAdmin.from('rate_events').insert({ bucket });

  if (Math.random() < 0.02) {
    await supabaseAdmin
      .from('rate_events')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  }
  return false;
}