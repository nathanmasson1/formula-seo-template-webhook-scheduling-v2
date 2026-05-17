import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { isPostPublic } from '../lib/postVisibility';
import { getConfiguredSiteUrl } from '../lib/siteUrl';
import { readData } from '../lib/readData';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => isPostPublic(data));
  const siteConfig = readData<any>('siteConfig.json', {});
  const siteUrl = getConfiguredSiteUrl(context.site);

  return rss({
    title: siteConfig.name || 'Formula SEO',
    description: siteConfig.description || siteConfig.seo?.description || '',
    site: siteUrl,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/${post.id}/`,
      })),
    customData: '<language>pt-br</language>',
  });
}
