import { AppBarNav, AppBarNavItem } from 'tabular-ui';

import { pages } from '../content';
import { cn } from '../lib/cn';
import { Rail, Section } from './layout';

const foundationPages = [pages.color, pages.typography, pages.density];

/**
 * The Foundations pages' shared top: title, lead, and the links between the
 * three (docs/site.md §3). Links, not Tabs: each is a page with its own URL,
 * and tabs switch a view where a nav changes the page (AppBar's README). The
 * library's AppBarNav is that nav, with aria-current on the page you're on.
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
        <div className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">{title}</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">{lead}</p>
        </div>
        <AppBarNav aria-label="Foundations" className="-ml-[var(--pad-control-x)]">
          {foundationPages.map((page) => (
            <AppBarNavItem key={page.href} href={page.href} active={page === current}>
              {page.label}
            </AppBarNavItem>
          ))}
        </AppBarNav>
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
