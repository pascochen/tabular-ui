import type { SiteComponent } from '../content';
import { cn } from '../lib/cn';

/**
 * Where a specimen's plate sits (docs/site.md D3). The owner chooses between
 * paper and dark plates from the comparison at /plates; until then the site
 * uses `defaultGround`.
 */
export type Ground = 'paper' | 'dark';
export const defaultGround: Ground = 'paper';

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
  ground = defaultGround,
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
 * built, dashed and labelled in words when not.
 */
export function ComponentTag({ component }: { component: SiteComponent }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border px-2 py-0.5 text-site-small text-text-body',
        component.built ? 'border-border-strong' : 'border-dashed border-border-strong text-text-secondary',
      )}
    >
      {component.title}
      {component.built ? null : <span className="sr-only">, to build</span>}
    </span>
  );
}
