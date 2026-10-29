import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { siteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = ['', '/explore', '/commission', '/experiences', '/join'].map(path => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly' as const,
  }));

  try {
    const { data } = await supabaseAdmin.from('artists').select('id').eq('status', 'verified');
    const artists: MetadataRoute.Sitemap = (data || []).map((a: { id: string }) => ({
      url: `${base}/artist/${a.id}`,
      changeFrequency: 'weekly' as const,
    }));
    return [...pages, ...artists];
  } catch {
    return pages;
  }
}