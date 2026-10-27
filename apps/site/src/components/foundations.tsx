import { pages } from '../content';
import { cn } from '../lib/cn';
import { focusRing, standaloneLink } from '../lib/styles';
import { Rail, Section } from './layout';

const foundationPages = [pages.color, pages.typography, pages.density];

/**
 * The Foundations pages' shared top (option A of the 2026-10-27 navigation
 * critique, owner): the section's name, the three pages, then the page's own
 * title and lead. Until then the title came first and the links sat under the
 * lead at 13px, the library AppBarNav's size, beside a 64px heading, so most
 * visitors missed them and never knew they were inside Foundations.
 *
 * Links, not Tabs: each is a page with its own URL, and tabs switch a view
 * where a nav changes the page (AppBar's README). Built here at reading size
 * rather than by restyling AppBarNav, whose size suits the product. The
 * current page is ink and semibold, with a 2px ink rule under it (the width
 * §7.8 reserves for the active tab, in the colour the library's line Tabs
 * use), and carries aria-current.
 */
export function FoundationsHeader({
  current,
  title,
  lead,
}: {
  current: (typeof foundationPages)[number];
  title: string;
  lead: string;
}) {
  return (
    <Section rule={false}>
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        <div className="flex flex-col gap-[var(--gap-bonded)]">
          <p id="foundations-label" className="text-site-small font-semibold text-text-secondary">
            Foundations
          </p>
          <nav aria-labelledby="foundations-label">
            <ul role="list" className="flex flex-wrap gap-x-[var(--site-gap)] border-b border-border">
              {foundationPages.map((page) => {
                const active = page === current;
                return (
                  <li key={page.href}>
                    <a
                      href={page.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // -mb-px lays the current page's rule over the list's own 1px rule.
                        '-mb-px inline-flex h-[var(--h-control-lg)] items-center border-b-[length:var(--border-width-2)] text-site-body',
                        active
                          ? 'border-fill-interactive font-semibold text-text-primary'
                          : cn('border-transparent font-medium', standaloneLink, 'text-text-body'),
                        focusRing,
                      )}
                    >
                      {page.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">{title}</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">{lead}</p>
        </div>
      </Rail>
    </Section>
  );
}

/**
 * The same sample in both modes, side by side (docs/site.md D4): dark and light
 * are not mirrors (§0 rule 4), so a Foundations page shows both wherever a value
 * differs. The dark half sets data-theme="dark" and its own ground and text.
 */
export function ModePair({
  children,
  className,
}: {
  children: (mode: 'light' | 'dark') => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-[var(--site-gap-tight)] md:grid-cols-2', className)}>
      {(['light', 'dark'] as const).map((mode) => (
        <div
          key={mode}
          data-theme={mode === 'dark' ? 'dark' : undefined}
          className="flex flex-col gap-[var(--gap-group)] border border-border bg-canvas p-[var(--site-gap-tight)] text-base text-text-body"
        >
          <p className="text-xs font-medium text-text-secondary">{mode === 'light' ? 'Light' : 'Dark'}</p>
          {children(mode)}
        </div>
      ))}
    </div>
  );
}

/** A token's name and resolved step, as mono identifiers (§8.3). */
export function TokenLabel({ name, detail }: { name: string; detail?: React.ReactNode }) {
  return (
    <p className="flex flex-wrap gap-x-[var(--gap-inline)] text-xs text-text-secondary">
      <code className="text-text-body">{name}</code>
      {detail ? <span>{detail}</span> : null}
    </p>
  );
}
