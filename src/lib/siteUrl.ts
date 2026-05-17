import { readData } from './readData';

type SiteConfig = {
  url?: string;
};

export const DEFAULT_SITE_URL = 'https://formulaseo.com.br';

export function normalizeSiteUrl(value?: string | URL | null) {
  const raw = value?.toString().trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, '');
}

export function getConfiguredSiteUrl(fallback?: string | URL | null) {
  const site = readData<SiteConfig>('siteConfig.json', {});
  return normalizeSiteUrl(site.url || fallback || DEFAULT_SITE_URL);
}

export function buildSiteUrl(pathOrUrl: string | URL, siteUrl = getConfiguredSiteUrl()) {
  return new URL(pathOrUrl.toString(), `${normalizeSiteUrl(siteUrl)}/`).toString();
}
