import { useLocation } from 'react-router';
import { Button, buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger } from 'tabular-ui';

import { external, pages } from '../content';
import { cn } from '../lib/cn';
import { ExternalMark } from './layout';

const internal = [pages.components, pages.vocabulary, pages.foundations].filter((page) => page.live);
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
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="px-2 pt-2 md:px-4 min-[1200px]:px-8 min-[1200px]:pt-4">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[calc(var(--site-w-wide)+32px)] items-center gap-[var(--site-gap)] border border-border bg-canvas px-2 py-[7px] md:px-4 md:py-[9px]"
      >
        <a href="/" className={cn('shrink-0', buttonVariants({ variant: 'ghost' }), 'h-auto px-0')}>
          <img
            src="/tabular-wordmark.svg"
            alt="Tabular UI"
            width={153}
            height={26}
            className="h-[22px] w-auto md:h-7"
          />
        </a>

        {internal.length > 0 ? (
          <ul role="list" className="hidden items-center md:flex">
            {internal.map((page) => (
              <li key={page.href}>
                <a
                  href={page.href}
                  aria-current={isCurrent(page.href) ? 'page' : undefined}
                  data-active={isCurrent(page.href) ? '' : undefined}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'text-text-secondary data-[active]:font-semibold data-[active]:text-text-primary',
                  )}
                >
                  {page.label}
                </a>
              </li>
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
          <li>
            <a href={external.demo.href} className={buttonVariants({ size: 'lg' })}>
              {external.demo.label}
              <ExternalMark />
            </a>
          </li>
        </ul>

        {/* Below md the links fold into the library's Menu (D8), composed here:
            AppBar has no responsive collapse yet. */}
        <div className="ml-auto md:hidden">
          <Menu>
            <MenuTrigger render={<Button variant="outline">Menu</Button>} />
            <MenuContent align="end">
              {internal.map((page) => (
                <MenuItem key={page.href} render={<a href={page.href} />}>
                  {page.label}
                </MenuItem>
              ))}
              {[external.demo, ...elsewhere].map((link) => (
                <MenuItem key={link.href} render={<a href={link.href} />}>
                  {link.label}
                  <ExternalMark />
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        </div>
      </nav>
    </header>
  );
}
