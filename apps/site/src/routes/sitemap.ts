import { componentPage, components, pages } from '../content';
import { canonicalUrl } from '../lib/meta';

/**
 * `/sitemap.xml` (docs/site.md §12), a resource route the build prerenders to a
 * file. It lists every page, Principles included (it stays indexed while it's
 * out of the nav and footer, owner 2026-10-27), and one URL per built
 * component, read from the same list the pages are. The 404 isn't a page.
 * `tests/pages.spec.ts` checks it against the routes the tests visit.
 */
export function loader() {
  const paths = [
    '/',
    pages.principles.href,
    ...components.filter((c) => c.built).map((c) => componentPage(c.name)),
    pages.vocabulary.href,
    pages.color.href,
    pages.typography.href,
    pages.density.href,
    pages.gettingStarted.href,
  ];
  const urls = paths.map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
