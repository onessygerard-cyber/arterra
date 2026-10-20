import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio',
          '/api/',
          '/track',
          '/submit-artwork',
          '/artist-login',
          '/artist/dashboard',
          '/artist/profile',
          '/artist/password',
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}