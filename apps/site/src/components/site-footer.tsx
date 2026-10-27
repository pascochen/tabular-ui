import { useId } from 'react';

import { demoSoonLabel, external, pages } from '../content';
import { standaloneLink } from '../lib/styles';
import { ExternalMark, Rail } from './layout';

type FooterLink = { href: string; label: string; external?: boolean; soon?: boolean };

/**
 * The footer's columns (docs/site.md §4, "Shared"). A link to a page that
 * isn't built yet is left out, and a column with nothing live is too.
 *
 * Owner, 2026-10-27: Principles left the footer (the page stays, linked from
 * each component page that carries a principle), GitHub moved from Try it to
 * About, and About replaced the closing line that named the license and author.
 */
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Guide',
    // The nav's labels and destinations (owner, 2026-10-27): one name per place.
    links: [pages.components, pages.gettingStarted, pages.vocabulary]
      .filter((page) => page.live)
      .map(({ href, label }) => ({ href, label })),
  },
  {
    title: 'Foundations',
    links: [pages.color, pages.typography, pages.density]
      .filter((page) => page.live)
      .map(({ href, label }) => ({ href, label })),
  },
  {
    title: 'Try it',
    links: [
      // While the demo isn't ready, its entry is text, not a link (owner, 2026-10-26).
      external.demo.ready
        ? { href: external.demo.href, label: external.demo.label, external: true }
        : { href: external.demo.href, label: demoSoonLabel, soon: true },
      { href: external.storybook.href, label: external.storybook.label, external: true },
    ],
  },
  {
    title: 'About',
    links: [external.author, external.license, external.github].map(({ href, label }) => ({
      href,
      label,
      external: true,
    })),
  },
].filter((column) => column.links.length > 0);

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <p id={id} className="text-site-small font-semibold text-text-secondary">
        {title}
      </p>
      <ul role="list" aria-labelledby={id} className="flex flex-col gap-[var(--gap-control-icon)]">
        {links.map((link) => (
          <li key={link.href}>
            {link.soon ? (
              <span className="text-site-small text-text-secondary">{link.label}</span>
            ) : (
              <a href={link.href} className={`${standaloneLink} text-site-small text-text-body`}>
                {link.label}
                {link.external ? <ExternalMark /> : null}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border pt-[calc(var(--site-section-y)/2)] pb-8">
      {/* One column on a phone. At tablet width the brand takes its own row above
          four link columns, which at five across were about 130px wide; five
          across from lg. */}
      <Rail className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-4 lg:grid-cols-5">
        <div className="flex flex-col gap-[var(--gap-group)] md:col-span-4 lg:col-span-1">
          <img src="/tabular-wordmark.svg" alt="Tabular UI" width={153} height={26} className="h-7 w-auto self-start" />
          <p className="text-site-small text-text-secondary">Components for agent-written, human-verified work.</p>
        </div>
        {columns.map((column) => (
          <FooterColumn key={column.title} {...column} />
        ))}
      </Rail>
    </footer>
  );
}
