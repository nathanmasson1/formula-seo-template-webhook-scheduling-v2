import type { APIContext } from 'astro';
import { escapeXml, getConfiguredSiteUrl } from '../lib/sitemap';

export async function GET(context: APIContext) {
  const siteUrl = getConfiguredSiteUrl(context.site);
  const sitemapUrl = `${siteUrl}/sitemap-0.xml`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(sitemapUrl)}</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
