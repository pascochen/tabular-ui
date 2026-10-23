import { cloneElement, isValidElement } from 'react';

import { cn } from '../../../lib/utils';
import { buttonVariants } from '../../foundational/Button/variants';

export type AppBarProps = React.ComponentProps<'header'> & {
  /**
   * Leading edge — logo or wordmark. A slot, not a component: `AppBar` owns no
   * branding of its own, so the approved design can drop straight in.
   */
  brand?: React.ReactNode;
  /** Trailing edge — account menu, primary action, icon actions. */
  actions?: React.ReactNode;
};

/**
 * AppBar — product.
 *
 * The application's top navigation band. Renders `<header role="banner">`,
 * which is the landmark assistive technology uses to skip page chrome.
 *
 * **Not `Toolbar`, and the distinction is load-bearing.** `Toolbar` is
 * `role="toolbar"` — a group of controls acting on the panel below it.
 * `AppBar` is page-level chrome that changes which page you are on. Merging
 * them would make a screen reader announce navigation as a control group.
 *
 * Neutral throughout: §0 rule 1 puts structure in neutral, and a navbar is
 * structure. §1 does list "active nav item" under the interactive role, so a
 * coloured (sage) active treatment would be legal — see README for why the default is
 * neutral and how to change it.
 *
 * Three regions, laid out brand / nav / actions. The nav region takes the
 * slack, so `AppBarNav`'s `align` decides whether the items sit against the
 * brand or against the actions.
 */
function AppBar({ brand, actions, children, className, ...props }: AppBarProps) {
  return (
    <header
      role="banner"
      data-slot="app-bar"
      className={cn(
        'sticky top-0 z-40 flex w-full items-center gap-[var(--gap-group)]',
        // §7.4 --pad-band-y (8px) around a 32px --h-control child, plus the
        // 1px rule, measures 49px — the band every shell header shares.
        // --h-control-lg is the floor, matching `Toolbar`.
        'min-h-[var(--h-control-lg)] px-[var(--pad-page-x)] py-[var(--pad-band-y)]',
        // §4 elevation: a background step plus a 1px rule, not a shadow.
        // Shadows barely register on ledger-950.
        'border-b border-border bg-surface',
        className,
      )}
      {...props}
    >
      {brand ? (
        <div data-slot="app-bar-brand" className="flex shrink-0 items-center">
          {brand}
        </div>
      ) : null}

      {children}

      {actions ? (
        <div
          data-slot="app-bar-actions"
          // ml-auto: actions own the trailing edge even with no AppBarNav to
          // take the slack — a bar of brand + breadcrumb + actions otherwise
          // packs the actions against the breadcrumb. Harmless when a nav is
          // present, since the nav's flex-1 leaves no free space.
          className="ml-auto flex shrink-0 items-center gap-[var(--gap-inline)]"
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export type AppBarNavProps = React.ComponentProps<'nav'> & {
  /** Where the items sit in the space between brand and actions. */
  align?: 'start' | 'center' | 'end';
};

/**
 * The navigation region. Renders a `<nav>` landmark around a real list.
 *
 * `role="list"` is explicit because Tailwind's preflight sets
 * `list-style: none`, and Safari drops list semantics from an unstyled list —
 * so the item count stops being announced with no visible symptom.
 */
function AppBarNav({
  className,
  align = 'start',
  'aria-label': ariaLabel = 'Main',
  children,
  ...props
}: AppBarNavProps) {
  return (
    <nav
      data-slot="app-bar-nav"
      aria-label={ariaLabel}
      className={cn(
        'flex min-w-0 flex-1 items-center',
        align === 'center' && 'justify-center',
        align === 'end' && 'justify-end',
        className,
      )}
      {...props}
    >
      {/*
        No gap. Each item is a ghost control carrying --pad-control-x (8px) on
        both sides, so adjacent labels already sit 16px apart. Adding a gap on
        top would double-count the padding.
      */}
      <ul role="list" className="flex items-center">
        {children}
      </ul>
    </nav>
  );
}

export type AppBarNavItemProps = React.ComponentProps<'a'> & {
  /** Marks the current page. Drives `aria-current` as well as the styling. */
  active?: boolean;
  /**
   * Swap the `<a>` for a router's link component, keeping every style and
   * state prop: `render={<Link to="/orders" />}`. This is why `AppBar` needs
   * no router dependency of its own.
   */
  render?: React.ReactElement<{ className?: string }>;
};

/**
 * A single navigation link.
 *
 * **A real `<a>`, styled with `buttonVariants` — not Base UI's `Button`.**
 * `Button` runs `useButton`, which merges `type="button"` when `nativeButton`
 * is true (and logs a dev error if the element is not a `<button>`), or
 * `role="button"` when it is false. On an anchor the second is an actual
 * regression: the link would be announced as a button and lose its navigation
 * semantics. An anchor needs no behavior polyfill — the browser already gives
 * it focus, Enter activation, middle-click and "open in new tab" — so only the
 * appearance is shared, via the same cva `Button` itself consumes.
 *
 * Active state carries three signals: `aria-current="page"` for assistive
 * technology, `data-active` for styling, and weight plus colour for sighted
 * users. It survives grayscale, and no hue is spent on it.
 */
function AppBarNavItem({ className, active = false, render, children, ...props }: AppBarNavItemProps) {
  const linkClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    // Inactive is secondary, active is the strongest text step plus 600.
    // §8.5 names "active nav" as a --font-semibold case; 600 is the ceiling.
    'text-text-secondary hover:text-text-body',
    // The BRACKETED data-[active] form is required. Tailwind's data-active
    // shorthand compiles inside :where(), which has zero specificity, so it
    // ties with the base colour above and loses on source order. Same trap
    // `Tabs` documents.
    'data-[active]:font-semibold data-[active]:text-text-primary',
    className,
  );

  const linkProps = {
    'data-slot': 'app-bar-nav-item',
    'data-active': active ? '' : undefined,
    'aria-current': active ? ('page' as const) : undefined,
    ...props,
  };

  return (
    <li className="shrink-0">
      {isValidElement(render) ? (
        cloneElement(render, { ...linkProps, className: cn(linkClassName, render.props.className) }, children)
      ) : (
        <a className={linkClassName} {...linkProps}>
          {children}
        </a>
      )}
    </li>
  );
}

export { AppBar, AppBarNav, AppBarNavItem };
