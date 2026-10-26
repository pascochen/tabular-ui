import { CaretDownIcon } from '@phosphor-icons/react';
import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from 'tabular-ui';

import { CopyCommand } from '../components/copy-command';
import { ExternalMark, Rail, Section } from '../components/layout';
import { components, pages, storybookDocs } from '../content';
import { textLink } from '../lib/styles';
import { ComponentPair } from '../specimens';
import NotFound from './not-found';
import type { Route } from './+types/component';

const built = components.filter((c) => c.built);
const find = (name?: string) => built.find((c) => c.name === name);

export const meta: Route.MetaFunction = ({ params }) => {
  const c = find(params.name);
  return c
    ? [{ title: `${c.title} · Tabular UI` }, { name: 'description', content: `${c.title}: ${c.decision}` }]
    : [{ title: 'Page not found · Tabular UI' }];
};

/**
 * One page per built component (wireframe `78:595`): the jump menu, the name
 * and its decision, the before/after pair (D2), its install command (D9), its
 * Storybook page, and the components either side in run order.
 */
export default function ComponentPage({ params }: Route.ComponentProps) {
  const c = find(params.name);
  if (!c) return <NotFound />;
  const i = built.indexOf(c);
  const previous = built[i - 1];
  const next = built[i + 1];

  return (
    <Section rule={false}>
      <Rail size="reading" className="flex flex-col gap-[var(--site-gap)]">
        <Menu>
          <MenuTrigger
            render={
              <Button variant="outline" className="self-start">
                Jump to a component
                <CaretDownIcon />
              </Button>
            }
          />
          <MenuContent>
            {built.map((b) => (
              <MenuItem key={b.name} render={<a href={`${pages.components.href}/${b.name}`} />}>
                {b.title}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>

        <div className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">{c.title}</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">{c.decision}</p>
        </div>

        <section aria-labelledby="pair-title">
          {/* Hidden, not absent: a component's own heading inside the pair (AgentPlan's
              <h3>) must not follow the page's <h1> with a level skipped. */}
          <h2 id="pair-title" className="sr-only">
            Before and after
          </h2>
          <ComponentPair name={c.name} />
        </section>

        <div className="flex flex-col gap-[var(--gap-group)]">
          <h2 className="text-site-title font-semibold text-text-primary">Install</h2>
          <CopyCommand command={`pnpm dlx shadcn@latest add https://tabularui.com/r/${c.name}.json`} />
          <p className="flex flex-wrap gap-x-[var(--site-gap)] gap-y-[var(--gap-inline)] text-site-small text-text-secondary">
            <a href={pages.gettingStarted.href} className={textLink}>
              Set up the package first
            </a>
            <a href={storybookDocs(c.name)} className={textLink}>
              {c.title} in Storybook
              <ExternalMark />
            </a>
          </p>
        </div>

        <nav
          aria-label="Components in run order"
          className="flex justify-between gap-[var(--site-gap)] border-t border-border pt-[var(--site-gap)]"
        >
          {previous ? (
            <a href={`${pages.components.href}/${previous.name}`} className={`${textLink} flex flex-col no-underline`}>
              <span className="text-site-small text-text-secondary">Previous</span>
              <span className="text-site-title font-semibold text-text-primary underline">{previous.title}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a
              href={`${pages.components.href}/${next.name}`}
              className={`${textLink} flex flex-col items-end text-right no-underline`}
            >
              <span className="text-site-small text-text-secondary">Next</span>
              <span className="text-site-title font-semibold text-text-primary underline">{next.title}</span>
            </a>
          ) : null}
        </nav>
      </Rail>
    </Section>
  );
}
