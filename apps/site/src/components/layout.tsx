import { cn } from '../lib/cn';

/** Marks a link to another site. Decorative: the link's name never depends on it (§11). */
export function ExternalMark() {
  return <span aria-hidden="true"> ↗</span>;
}

const railWidths = {
  wide: 'max-w-[calc(var(--site-w-wide)+2*var(--site-pad-x))]',
  reading: 'max-w-[calc(var(--site-w-reading)+2*var(--site-pad-x))]',
  prose: 'max-w-[calc(var(--site-w-prose)+2*var(--site-pad-x))]',
};

/**
 * The content column (docs/site.md §7). A max-width with the page margin as
 * padding, not a column span: 1344px wide, 1040px for reading pages, 680px
 * for prose.
 */
export function Rail({
  size = 'wide',
  className,
  children,
}: {
  size?: keyof typeof railWidths;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mx-auto w-full px-[var(--site-pad-x)]', railWidths[size], className)}>{children}</div>;
}

/**
 * One band of a page. Sections are separated by a full-width 1px rule, never by
 * a tint (docs/site.md D3): the first section on a page drops its rule.
 */
export function Section({
  id,
  labelledBy,
  rule = true,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  rule?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('py-[var(--site-section-y)]', rule && 'border-t border-border', className)}
    >
      {children}
    </section>
  );
}

/** A section's heading, its lead, and an optional link aligned to the lead's baseline (wireframe `76:98`). */
export function SectionHeader({
  id,
  title,
  lead,
  action,
}: {
  id: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[var(--gap-group)] md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-[var(--gap-control-icon)]">
        <h2 id={id} className="text-site-heading-sm font-semibold text-text-primary md:text-site-heading">
          {title}
        </h2>
        {lead ? <p className="text-site-body text-text-secondary">{lead}</p> : null}
      </div>
      {action ? <div className="text-site-small">{action}</div> : null}
    </div>
  );
}
