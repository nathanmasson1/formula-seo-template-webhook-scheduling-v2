import { getCollection } from 'astro:content';
import { getConfiguredSiteUrl } from './siteUrl';
import { isPostPublic } from './postVisibility';

type SitemapUrl = {
  loc: string;
  lastmod?: Date;
  changefreq?: string;
  priority?: string;
};

const staticRoutes: SitemapUrl[] = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/blog/', changefreq: 'weekly', priority: '0.8' },
  { loc: '/backlinks/', changefreq: 'monthly', priority: '0.8' },
  { loc: '/criacao-de-sites/', changefreq: 'monthly', priority: '0.8' },
  { loc: '/sobre/', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contato/', changefreq: 'monthly', priority: '0.6' },
  { loc: '/privacidade/', changefreq: 'yearly', priority: '0.3' },
  { loc: '/termos/', changefreq: 'yearly', priority: '0.3' },
];

export { getConfiguredSiteUrl };

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export async function getSitemapUrls(siteUrl: string): Promise<SitemapUrl[]> {
  const posts = await getCollection('blog', ({ data }) => isPostPublic(data));
  const postRoutes = posts.map((post) => ({
    loc: `/${post.id}/`,
    lastmod: post.data.updatedDate || post.data.pubDate,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  return [...staticRoutes, ...postRoutes].map((item) => ({
    ...item,
    loc: `${siteUrl}${item.loc}`,
  }));
}

export function renderSitemapUrlset(urls: SitemapUrl[]) {
  const entries = urls.map((url) => {
    const lastmod = url.lastmod ? `\n    <lastmod>${formatDate(url.lastmod)}</lastmod>` : '';
    const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
    const priority = url.priority ? `\n    <priority>${url.priority}</priority>` : '';

    return `  <url>
    <loc>${escapeXml(url.loc)}</loc>${lastmod}${changefreq}${priority}
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}
