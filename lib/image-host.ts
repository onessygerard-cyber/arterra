const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');

export function canOptimize(src: string | null | undefined): boolean {
  return BASE !== '' && !!src && src.startsWith(`${BASE}/storage/v1/object/public/`);
}