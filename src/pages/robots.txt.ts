import type { APIContext } from 'astro';
import { getConfiguredSiteUrl } from '../lib/siteUrl';

export function GET(context: APIContext) {
  const siteUrl = getConfiguredSiteUrl(context.site);

  return new Response(`User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap-index.xml
`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
