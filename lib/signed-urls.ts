import { supabaseAdmin } from '@/lib/supabase-admin';

export async function signReferenceImages(paths: string[] | null | undefined): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const { data, error } = await supabaseAdmin.storage
    .from('brief-references')
    .createSignedUrls(paths, 60 * 60);
  if (error || !data) return [];
  const urls: string[] = [];
  for (const d of data) {
    if (d.signedUrl) urls.push(d.signedUrl);
  }
  return urls;
}