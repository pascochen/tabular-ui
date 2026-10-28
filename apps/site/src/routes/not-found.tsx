import { buttonVariants } from 'tabular-ui';

import { Rail, Section } from '../components/layout';
import { componentGrid } from '../content';
import { notFoundMeta } from '../lib/meta';
import type { Route } from './+types/not-found';

export const meta: Route.MetaFunction = () => notFoundMeta;

/**
 * The 404 (docs/site.md §3). Prerendered at /404 and copied to 404.html, which
 * Vercel serves for any path it has no file for; the catch-all route renders
 * the same page, so a visitor's browser hydrates it without a mismatch. Owner
 * copy, 2026-10-28: one line on why, without blaming the visitor, and one way
 * on, the hero's "Browse components" to the same grid. It's the page's only
 * action, so it's the filled button.
 */
export default function NotFound() {
  return (
    <Section rule={false}>
      {/* The hero's rhythm: heading and lead together, the action a step further down. */}
      <Rail size="reading" className="flex flex-col items-start gap-[var(--site-gap)]">
        <div className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">Page not found</h1>
          <p className="text-site-lead text-text-secondary">The link may be out of date, or the page may have moved.</p>
        </div>
        <a href={componentGrid} className={buttonVariants({ size: 'lg' })}>
          Browse components
        </a>
      </Rail>
    </Section>
  );
}
