import { useLocation } from 'react-router';
import { Button, buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger } from 'tabular-ui';

import { external, pages } from '../content';
import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import { ExternalMark } from './layout';

type Page = (typeof pages)[keyof typeof pages];

// The system on the left, then on the right what takes you off to use it
// (owner, 2026-10-27): Storybook, GitHub, and Get started, the one page of this
// site there, with no arrow. Principles left the nav and the footer the same
// day; each component page that carries a principle links to it. The disabled
// "Demo (soon)" button left the nav too: where the demo goes when it's ready
// is still to decide. The hero and the closing band keep their demo action.
const system = [pages.components, pages.foundations, pages.vocabulary].filter((page) => page.live);
const setUp: Page[] = [pages.gettingStarted].filter((page) => page.live);
const elsewhere = [external.storybook, external.github];

/**
 * The site's nav (docs/site.md D8): an inset bar with a 1px rule all round,
 * solid paper, scrolling with the page. Built in the site rather than with the
 * library's AppBar, which is a full-width sticky band, but on what AppBar's
 * README records: links are real <a> elements styled with buttonVariants
 * (Base UI's Button would announce them as buttons), lists carry role="list"
 * (Safari drops it from an unstyled list), and the current page takes
 * aria-current with the bracketed data-[active] form.
 *
 * The bar sits 16px outside the content column on each side, with 16px inside,
 * so the wordmark lines up with the content below it at every width.
 */
export function SiteNav() {
  const { pathname } = useLocation();
  const isCurrent = (page: Page) => {
    const base = 'current' in page ? page.current : page.href;
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const pageLink = (page: Page) => (
    <a
      href={page.href}
      aria-current={isCurrent(page) ? 'page' : undefined}
      data-active={isCurrent(page) ? '' : undefined}
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'text-text-secondary data-[active]:font-semibold data-[active]:text-text-primary',
      )}
    >
      {page.label}
    </a>
  );

  return (
    <header className="px-2 pt-2 md:px-4 min-[1200px]:px-8 min-[1200px]:pt-4">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[calc(var(--site-w-wide)+32px)] items-center gap-[var(--site-gap)] border border-border bg-canvas px-2 py-[7px] md:px-4 md:py-[9px]"
      >
        {/* A plain link, not a ghost button: the button's hover overlay laid a grey
            wash over the brand mark (owner, 2026-10-26). No hover effect at all;
            the pointer is the cue, and keyboard focus keeps the ring. The mark
            keeps its phone size until lg: at 28px the bar needed 728px of
            content at 768px, where it has 703px. */}
        <a href="/" className={cn('shrink-0', focusRing)}>
          <img
            src="/tabular-wordmark.svg"
            alt="Tabular UI"
            width={153}
            height={26}
            className="h-[22px] w-auto lg:h-7"
          />
        </a>

        {system.length > 0 ? (
          <ul role="list" className="hidden items-center md:flex">
            {system.map((page) => (
              <li key={page.href}>{pageLink(page)}</li>
            ))}
          </ul>
        ) : null}

        <ul role="list" className="ml-auto hidden items-center gap-[var(--gap-inline)] md:flex">
          {elsewhere.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={buttonVariants({ variant: 'ghost' })}>
                {link.label}
                <ExternalMark />
              </a>
            </li>
          ))}
          {setUp.map((page) => (
            <li key={page.href}>{pageLink(page)}</li>
          ))}
        </ul>

        {/* Below md the links fold into the library's Menu (D8), composed here:
            AppBar has no responsive collapse yet. */}
        <div className="ml-auto md:hidden">
          <Menu>
            <MenuTrigger render={<Button variant="outline">Menu</Button>} />
            <MenuContent align="end">
              {/* The desktop order: the system, then Storybook, GitHub and Get started. */}
              {system.map((page) => (
                <MenuItem key={page.href} render={<a href={page.href} />}>
                  {page.label}
                </MenuItem>
              ))}
              {elsewhere.map((link) => (
                <MenuItem key={link.href} render={<a href={link.href} />}>
                  {link.label}
                  <ExternalMark />
                </MenuItem>
              ))}
              {setUp.map((page) => (
                <MenuItem key={page.href} render={<a href={page.href} />}>
                  {page.label}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </div>
      </nav>
    </header>
  );
}
