import type { APIContext } from 'astro';
import { getConfiguredSiteUrl, getSitemapUrls, renderSitemapUrlset } from '../lib/sitemap';

export async function GET(context: APIContext) {
  const siteUrl = getConfiguredSiteUrl(context.site);
  const urls = await getSitemapUrls(siteUrl);

  return new Response(renderSitemapUrlset(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
