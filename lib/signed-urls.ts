import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'brief-references';
const HOUR = 60 * 60;

export async function signReferenceImages(paths: string[] | null | undefined): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(paths, HOUR);
  if (error || !data) return [];
  const urls: string[] = [];
  for (const d of data) {
    if (d.signedUrl) urls.push(d.signedUrl);
  }
  return urls;
}

export async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrls(unique, HOUR);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const d of data) {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  }
  return map;
}