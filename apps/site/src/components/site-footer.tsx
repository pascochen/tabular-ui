import { useId } from 'react';

import { demoSoonLabel, external, pages } from '../content';
import { standaloneLink, textLink } from '../lib/styles';
import { ExternalMark, Rail } from './layout';

type FooterLink = { href: string; label: string; external?: boolean; soon?: boolean };

/**
 * The footer's columns (docs/site.md §4, "Shared"). A link to a page that
 * isn't built yet is left out, and a column with nothing live is too.
 */
const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Guide',
    links: [
      // The nav's labels and destinations (owner, 2026-10-27): one name per place.
      { href: pages.components.href, label: pages.components.label, live: pages.components.live },
      { href: pages.gettingStarted.href, label: pages.gettingStarted.label, live: pages.gettingStarted.live },
      { href: pages.principles.href, label: pages.principles.label, live: pages.principles.live },
      { href: pages.vocabulary.href, label: pages.vocabulary.label, live: pages.vocabulary.live },
    ]
      .filter((link) => link.live)
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
      ...[external.storybook, external.github].map(({ href, label }) => ({ href, label, external: true })),
    ],
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
      <Rail className="flex flex-col gap-[var(--site-gap)]">
        <div className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-4">
          <div className="flex flex-col gap-[var(--gap-group)]">
            <img
              src="/tabular-wordmark.svg"
              alt="Tabular UI"
              width={153}
              height={26}
              className="h-7 w-auto self-start"
            />
            <p className="text-site-small text-text-secondary">Components for agent-written, human-verified work.</p>
          </div>
          {columns.map((column) => (
            <FooterColumn key={column.title} {...column} />
          ))}
        </div>
        {/* One closing line (owner, 2026-10-27). It replaced a row with the byline, the
            version and the changelog: a small project whose version and changelog won't
            be kept current. Its links sit in a sentence, so they're text links. */}
        <p className="border-t border-border pt-[var(--site-gap-tight)] text-site-small text-text-secondary">
          Open source under the{' '}
          <a href={external.license.href} className={textLink}>
            {external.license.label}
            <ExternalMark />
          </a>
          , made by{' '}
          <a href={external.author.href} className={textLink}>
            {external.author.label}
            <ExternalMark />
          </a>
          .
        </p>
      </Rail>
    </footer>
  );
}
