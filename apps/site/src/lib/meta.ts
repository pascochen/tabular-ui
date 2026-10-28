import type { MetaDescriptor } from 'react-router';

/** The production origin. Canonical URLs, the sitemap and the social image are absolute. */
export const siteOrigin = 'https://tabularui.com';

/**
 * A page's canonical URL (docs/site.md §12). No trailing slash, as every link
 * on the site is written (owner, 2026-10-27): Vercel answers `/principles` and
 * `/principles/` alike, and the canonical says which one is the page.
 */
export function canonicalUrl(path: string): string {
  return path === '/' ? `${siteOrigin}/` : `${siteOrigin}${path.replace(/\/$/, '')}`;
}

/** The one shared social image (§12): the wordmark, unchanged, on paper. Made by `scripts/og-image.mjs`. */
export const socialImage = { path: '/og.png', width: 1200, height: 630, alt: 'Tabular UI' };

/**
 * Everything a page's `<head>` says about it: title, description, canonical
 * URL, and the Open Graph and Twitter tags that share them. Every route's
 * `meta` goes through here, so no page can ship without one of them.
 */
export function pageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const url = canonicalUrl(path);
  const image = `${siteOrigin}${socialImage.path}`;
  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Tabular UI' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: String(socialImage.width) },
    { property: 'og:image:height', content: String(socialImage.height) },
    { property: 'og:image:alt', content: socialImage.alt },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] satisfies MetaDescriptor[];
}

/**
 * The 404's head: no canonical URL and no social tags, since it isn't a page
 * anyone should share or find in a search. `noindex` says so to crawlers, which
 * also get the 404 status from Vercel.
 */
export const notFoundMeta = [
  { title: 'Page not found · Tabular UI' },
  { name: 'robots', content: 'noindex' },
] satisfies MetaDescriptor[];
