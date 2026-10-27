import { Rail, Section } from '../components/layout';
import { pages } from '../content';
import { standaloneLink } from '../lib/styles';
import type { Route } from './+types/not-found';

export const meta: Route.MetaFunction = () => [{ title: 'Page not found · Tabular UI' }];

/**
 * The 404 (docs/site.md §3). Prerendered at /404 and copied to 404.html, which
 * Vercel serves for any path it has no file for; the catch-all route renders
 * the same page, so a visitor's browser hydrates it without a mismatch. Draft copy.
 */
export default function NotFound() {
  return (
    <Section rule={false}>
      <Rail size="reading" className="flex flex-col gap-[var(--gap-group)]">
        <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">Page not found</h1>
        <p className="text-site-lead text-text-secondary">There’s no page at this address.</p>
        <p className="flex flex-wrap gap-x-[var(--site-gap)] text-site-body">
          <a href="/" className={`${standaloneLink} text-text-body`}>
            Home
          </a>
          <a href={pages.components.href} className={`${standaloneLink} text-text-body`}>
            Components
          </a>
        </p>
      </Rail>
    </Section>
  );
}
