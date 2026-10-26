import { pages, type SiteComponent } from '../content';
import { focusRing } from '../lib/styles';
import { cn } from '../lib/cn';

/**
 * Where a specimen's plate sits (docs/site.md D3, decided (c) on 2026-10-26):
 * dark where one specimen is the subject (the hero, each component page),
 * paper in the grids (the Components cards).
 */
export type Ground = 'paper' | 'dark';

/**
 * The frame and plate every specimen sits in (wireframe `76:45`).
 *
 * A dark plate sets `data-theme="dark"`: theme.css scopes dark mode as
 * `[data-theme='dark']`, so every token recomputes inside it and the components
 * draw in the mode they were designed for. It sets its own ground and text
 * colour, because inherited text comes from the light page (D4).
 *
 * A component that isn't built has a dashed frame, and says so in words: dashed
 * means placeholder (§7.8), and colour or shape is never the only signal.
 */
export function SpecimenFrame({
  ground = 'paper',
  placeholder = false,
  className,
  children,
}: {
  ground?: Ground;
  placeholder?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col border border-border-strong p-2', placeholder && 'border-dashed', className)}>
      <div
        data-theme={ground === 'dark' ? 'dark' : undefined}
        className="flex-1 bg-canvas p-[var(--site-gap-tight)] text-base text-text-body"
      >
        {children}
      </div>
    </div>
  );
}

/** A component's card: its specimen, name and decision (wireframe `78:191`). */
export function ComponentCard({
  component,
  ground,
  children,
}: {
  component: SiteComponent;
  ground?: Ground;
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-[var(--gap-group)]">
      <SpecimenFrame ground={ground} placeholder={!component.built} className="min-h-[280px]">
        {component.built ? (
          children
        ) : (
          <p className="text-text-secondary">
            <span className="font-medium">To build.</span> Not built yet.
          </p>
        )}
      </SpecimenFrame>
      <div className="flex flex-col gap-[var(--gap-control-icon)]">
        <h3 className="text-site-title-sm font-semibold text-text-primary">{component.title}</h3>
        <p className="text-site-small text-text-secondary">{component.decision}</p>
      </div>
    </article>
  );
}

/**
 * A component's name as a tag (wireframe `76:98`, "Carried by"). Solid when
 * built, and then a link to its card; dashed and labelled in words when not.
 */
export function ComponentTag({ component }: { component: SiteComponent }) {
  const base = 'inline-flex items-center rounded-xs border px-2 py-0.5 text-site-small';
  if (component.built && pages.components.live) {
    return (
      <a
        href={`${pages.components.href}#${component.name}`}
        className={cn(base, 'border-border-strong text-text-body hover:bg-bg-hover', focusRing)}
      >
        {component.title}
      </a>
    );
  }
  return (
    <span
      className={cn(
        base,
        component.built
          ? 'border-border-strong text-text-body'
          : 'border-dashed border-border-strong text-text-secondary',
      )}
    >
      {component.title}
      {component.built ? null : <span className="sr-only">, to build</span>}
    </span>
  );
}
