import { cloneElement, isValidElement } from 'react';

import { cn } from '../../../lib/utils';
import { TruncatedText } from '../TruncatedText';

export type BreadcrumbProps = React.ComponentProps<'nav'>;

/**
 * Breadcrumb — product. Composes `TruncatedText`.
 *
 * Where the page sits: its ancestors, nearest last, each a link, each followed
 * by a slash. A `<nav>` landmark named "Breadcrumb" around a real list, as the
 * WAI-ARIA breadcrumb pattern has it.
 *
 * Neutral throughout (§0 rule 1: a trail is structure). An ancestor is
 * secondary text at the resting weight, so the page's own name stays the
 * strongest thing on the line. The slash is `--color-text-tertiary`: a mark,
 * not text, and hidden from assistive technology, which hears a list.
 *
 * `--text-base` by default, the size of the controls beside it in the top
 * nav. A bare trail must not inherit: `AppBar` sets no size, and a trail
 * that took the document's 16px sat a step above the page switcher after it
 * (caught by the AppShell screenshots, 2026-11-17). `AppShellPageHeader`
 * raises it to the title's size.
 *
 * Two ways to end the trail:
 *
 * - In `AppShellPageHeader`'s `breadcrumb` slot, pass ancestors only. The
 *   band's `<h1>` is the current page, and the last slash leads into it.
 * - Anywhere else, end with a `BreadcrumbPage`.
 */
function Breadcrumb({ 'aria-label': ariaLabel = 'Breadcrumb', className, children, ...props }: BreadcrumbProps) {
  return (
    <nav data-slot="breadcrumb" aria-label={ariaLabel} className={cn('min-w-0 text-base', className)} {...props}>
      {/* role="list": preflight's `list-style: none` drops list semantics in Safari. */}
      <ol role="list" className="flex min-w-0 items-center gap-[var(--gap-inline)]">
        {children}
      </ol>
    </nav>
  );
}

/** A string truncates and repeats in a tooltip when cut off. Anything else renders as it is. */
function CrumbLabel({ children, onControl = false }: { children: React.ReactNode; onControl?: boolean }) {
  if (typeof children !== 'string') return children;
  return (
    <TruncatedText side="bottom" showOnControlFocus={onControl}>
      {children}
    </TruncatedText>
  );
}

export type BreadcrumbItemProps = React.ComponentProps<'a'> & {
  /**
   * Swap the `<a>` for a router's link component, keeping every style:
   * `render={<Link to="/projects/close" />}`.
   */
  render?: React.ReactElement<{ className?: string }>;
};

/**
 * One ancestor: a link, then the slash that leads to what follows it.
 *
 * A real `<a>`, hand-styled as text rather than with `buttonVariants`: a ghost
 * control's 8px padding and 1px border would push the first crumb 9px off the
 * x the page's text starts on. Every item in a trail is a link, so the
 * underline waits for hover and focus (§1, the list exception).
 */
function BreadcrumbItem({ className, render, children, ...props }: BreadcrumbItemProps) {
  const linkClassName = cn(
    'flex min-w-0 font-normal text-text-secondary hover:text-text-body',
    'decoration-1 underline-offset-2 hover:underline focus-visible:underline',
    'rounded-xs outline-none focus-visible:outline-ring',
    'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
    'focus-visible:outline-offset-[var(--ring-offset)]',
    className,
  );
  const linkProps = { 'data-slot': 'breadcrumb-link', ...props };
  const label = <CrumbLabel onControl>{children}</CrumbLabel>;

  return (
    <li data-slot="breadcrumb-item" className="flex min-w-0 items-center gap-[var(--gap-inline)]">
      {isValidElement(render) ? (
        cloneElement(render, { ...linkProps, className: cn(linkClassName, render.props.className) }, label)
      ) : (
        <a className={linkClassName} {...linkProps}>
          {label}
        </a>
      )}
      <span data-slot="breadcrumb-separator" aria-hidden="true" className="shrink-0 font-normal text-text-tertiary">
        /
      </span>
    </li>
  );
}

export type BreadcrumbPageProps = React.ComponentProps<'li'>;

/**
 * The current page, last in the trail: not a link, `aria-current="page"`, the
 * strongest text step at 600 (§8.5, as an active nav item). Leave it out in
 * `AppShellPageHeader`, where the `<h1>` is the current page.
 */
function BreadcrumbPage({ className, children, ...props }: BreadcrumbPageProps) {
  return (
    <li
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('flex min-w-0 font-semibold text-text-primary', className)}
      {...props}
    >
      <CrumbLabel>{children}</CrumbLabel>
    </li>
  );
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbPage };
