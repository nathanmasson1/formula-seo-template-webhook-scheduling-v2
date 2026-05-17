const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'twitter.com',
  'wa.me',
  'whatsapp.com',
  'x.com',
  'youtube.com',
  'youtu.be',
];

export function isSocialHref(href?: string) {
  if (!href) return false;

  try {
    const { hostname } = new URL(href);
    const host = hostname.replace(/^www\./, '').toLowerCase();
    return SOCIAL_HOSTS.some(socialHost => host === socialHost || host.endsWith(`.${socialHost}`));
  } catch {
    return false;
  }
}

export function socialLinkAttrs(href?: string, ariaLabel = 'Abrir rede social') {
  return isSocialHref(href)
    ? { target: '_blank', rel: 'nofollow noopener', 'aria-label': ariaLabel }
    : {};
}
