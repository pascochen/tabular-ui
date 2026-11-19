import { FigmaLogoIcon, GithubLogoIcon, NotebookIcon } from '@phosphor-icons/react';
import { useLocation } from 'react-router';
import { Button, buttonVariants, Menu, MenuContent, MenuItem, MenuTrigger } from 'tabular-ui';

import { external, newTab, pages } from '../content';
import { cn } from '../lib/cn';
import { focusRing, panel } from '../lib/styles';
import { ExternalMark } from './layout';

type Page = (typeof pages)[keyof typeof pages];

// The system on the left, with Get started after Vocabulary, and on the right
// the links off the site: GitHub, Storybook, then Figma (owner, 2026-11-18). From
// 2026-10-27 Get started sat on the right, after Storybook and GitHub.
// Principles left the nav and the footer on 2026-10-27; each component page
// that carries a principle links to it. The disabled "Demo (soon)" button left
// the nav too: where the demo goes, now that it's live (2026-11-04), is still to
// decide. The hero and the closing band keep their demo action.
const system: Page[] = [pages.components, pages.foundations, pages.vocabulary, pages.gettingStarted].filter(
  (page) => page.live,
);
// Each link off the site leads with its mark (owner, 2026-11-18): GitHub's
// logo, a notebook for Storybook, and Figma's logo. The icon is decoration:
// the label names the link.
const elsewhere = [
  { ...external.github, Icon: GithubLogoIcon },
  { ...external.storybook, Icon: NotebookIcon },
  { ...external.figma, Icon: FigmaLogoIcon },
];

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
      {/* As wide as its 600 form at rest, so the current page's weight moves no
          other link (§8.5): a hidden copy at 600, with no height and no text. */}
      <span
        data-label={page.label}
        className="inline-flex flex-col after:invisible after:h-0 after:overflow-hidden after:font-semibold after:content-[attr(data-label)_/_'']"
      >
        {page.label}
      </span>
    </a>
  );

  return (
    // Named for the page turn (index.css): the bar holds while the page changes.
    <header className="px-2 pt-2 [view-transition-name:site-nav] md:px-4 min-[1200px]:px-8 min-[1200px]:pt-4">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-[calc(var(--site-w-wide)+32px)] items-center gap-[var(--site-gap)] ${panel} px-2 py-2 md:px-4`}
      >
        {/* A plain link, not a ghost button: the button's hover overlay laid a grey
            wash over the brand mark (owner, 2026-10-26). No hover effect at all;
            the pointer is the cue, and keyboard focus keeps the ring. The mark
            keeps its phone size until lg, where the links appear. */}
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
          <ul role="list" className="hidden items-center lg:flex">
            {system.map((page) => (
              <li key={page.href}>{pageLink(page)}</li>
            ))}
          </ul>
        ) : null}

        <ul role="list" className="ml-auto hidden items-center gap-[var(--gap-inline)] lg:flex">
          {elsewhere.map((link) => (
            <li key={link.href}>
              {/* As Button draws a leading icon: bold, since 1em is under 16px
                  (§11.2), and 6px on the icon's side for its inboard glyph (§7.4). */}
              <a href={link.href} {...newTab} className={cn(buttonVariants({ variant: 'ghost' }), 'pl-1.5')}>
                <link.Icon weight="bold" aria-hidden="true" />
                {link.label}
                <ExternalMark />
              </a>
            </li>
          ))}
        </ul>

        {/* Below lg the links fold into the library's Menu (D8), composed here:
            AppBar has no responsive collapse yet. From md until 2026-11-07, when
            Instrument Sans's wider labels needed 731px at 768px, where the bar has
            702px. */}
        <div className="ml-auto lg:hidden">
          <Menu>
            <MenuTrigger render={<Button variant="outline">Menu</Button>} />
            <MenuContent align="end">
              {/* The desktop order: the system and Get started, then GitHub, Storybook and Figma. */}
              {system.map((page) => (
                <MenuItem key={page.href} render={<a href={page.href} />}>
                  {page.label}
                </MenuItem>
              ))}
              {elsewhere.map((link) => (
                <MenuItem key={link.href} render={<a href={link.href} {...newTab} />}>
                  <link.Icon weight="bold" aria-hidden="true" />
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
