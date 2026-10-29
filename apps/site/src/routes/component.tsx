import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';
import { Button, CodeView, Menu, MenuContent, MenuItem, MenuTrigger } from 'tabular-ui';

import { CopyCommand } from '../components/copy-command';
import { ExternalMark, Rail, Section } from '../components/layout';
import { componentGrid, componentPage, components, pages, principles, storybookDocs } from '../content';
import { cn } from '../lib/cn';
import { focusRing, standaloneLink } from '../lib/styles';
import { install, usage } from '../component-usage';
import { notFoundMeta, pageMeta } from '../lib/meta';
import { ComponentPair } from '../specimens';
import NotFound from './not-found';
import type { Route } from './+types/component';

const built = components.filter((c) => c.built);

// Previous and next follow the standalone-link rule (lib/styles), but the
// hover colour goes to the title alone: the label stays secondary.
const neighbour = `group ${focusRing}`;
const neighbourTitle = 'text-site-title font-semibold text-text-primary group-hover:text-text-interactive';
const find = (name?: string) => built.find((c) => c.name === name);

/** A line of copy, with `code` in backticks set as code (mono, one step smaller, §8.3). */
function Copy({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith('`') ? (
      <code key={i} className="font-mono text-site-small">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

/**
 * The principles a component carries, on its own page (owner, 2026-10-27):
 * each rule beside the component that keeps it, with the check a reviewer can
 * run. The Principles page keeps all three, linked from here only (2026-10-27).
 */
function RulesFollowed({ name }: { name: string }) {
  const followed = principles.filter((p) => p.carriedBy.some((c) => c.name === name));
  if (followed.length === 0) return null;
  return (
    <section
      aria-labelledby="rules-title"
      className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap-tight)]"
    >
      <h2 id="rules-title" className="text-site-title font-semibold text-text-primary">
        {followed.length === 1 ? 'The rule it follows' : 'The rules it follows'}
      </h2>
      <ul role="list" className="flex flex-col gap-[var(--gap-group)]">
        {followed.map((p) => (
          <li key={p.title} className="flex flex-col gap-[var(--gap-bonded)]">
            <p className="text-site-body font-semibold text-text-primary">{p.title}</p>
            <p className="text-site-small text-text-secondary">Check: {p.check}</p>
          </li>
        ))}
      </ul>
      <a href={pages.principles.href} className={`${standaloneLink} self-start text-site-small text-text-body`}>
        All {principles.length} principles
      </a>
    </section>
  );
}

/**
 * Every built component, beside the page from 1024px (owner, 2026-10-28,
 * variant A of the component-menu review): it sticks as the page scrolls, so
 * another component is always one click away. Below 1024px there's no room for
 * a column, and the page keeps the menu. The page you're on is marked as the
 * Foundations pages mark theirs: ink and semibold, with a 2px ink rule laid over
 * the list's 1px rule, and aria-current.
 */
function ComponentList({ current }: { current: string }) {
  return (
    <nav
      aria-labelledby="component-list-title"
      className="hidden flex-col gap-[var(--gap-inline)] lg:sticky lg:top-[var(--site-gap)] lg:flex"
    >
      <p id="component-list-title" className="text-site-small font-semibold text-text-secondary">
        All {built.length} components
      </p>
      <ul role="list" className="flex flex-col border-l border-border">
        {built.map((b) => {
          const active = b.name === current;
          return (
            <li key={b.name}>
              <a
                href={componentPage(b.name)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // -ml-px lays the current page's rule over the list's own 1px rule.
                  '-ml-px flex min-h-[var(--h-row-sm)] items-center border-l-[length:var(--border-width-2)] pl-[var(--gap-group)] text-site-small',
                  active
                    ? 'border-fill-interactive font-semibold text-text-primary'
                    : cn('border-transparent', standaloneLink, 'text-text-body'),
                  focusRing,
                )}
              >
                {b.title}
              </a>
            </li>
          );
        })}
      </ul>
      <a href={componentGrid} className={`${standaloneLink} self-start text-site-small text-text-body`}>
        All {components.length}, by moment
      </a>
    </nav>
  );
}

function WhenList({ id, title, lines }: { id: string; title: string; lines: readonly string[] }) {
  return (
    <div className="flex flex-col gap-[var(--gap-group)] border-t border-border pt-[var(--gap-group)]">
      <h2 id={id} className="text-site-title font-semibold text-text-primary">
        {title}
      </h2>
      <ul role="list" aria-labelledby={id} className="flex list-disc flex-col gap-[var(--gap-inline)] pl-5">
        {lines.map((line) => (
          <li key={line} className="text-site-body text-text-body">
            <Copy text={line} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export const meta: Route.MetaFunction = ({ params }) => {
  const c = find(params.name);
  return c
    ? pageMeta({
        title: `${c.title} · Tabular UI`,
        description: `${c.title}: ${c.decision}`,
        path: componentPage(c.name),
      })
    : notFoundMeta;
};

/**
 * One page per built component (wireframe `78:595`), decision first (owner,
 * 2026-10-27): the list of built components beside it from 1024px, or the menu
 * of them below that (2026-10-28), the name and its decision, when to use it and
 * when not, the principles it carries, the before/after pair (D2), its install
 * command (D9) and usage snippet, its Storybook page, and the components either
 * side in run order.
 */
export default function ComponentPage({ params }: Route.ComponentProps) {
  const c = find(params.name);
  if (!c) return <NotFound />;
  if (!c.useWhen || !c.avoidWhen) throw new Error(`${c.name} is built but has no useWhen / avoidWhen copy`);
  const i = built.indexOf(c);
  const previous = built[i - 1];
  const next = built[i + 1];

  return (
    <Section rule={false}>
      {/* From 1024px the list takes a column beside the reading column, the gap
          between them the page's own margin. The pair is centred in the wide
          rail, so the reading column keeps its 1040px where there's room. */}
      <Rail className="lg:grid lg:grid-cols-[auto_minmax(0,var(--site-w-reading))] lg:items-start lg:justify-center lg:gap-x-[var(--site-pad-x)]">
        <ComponentList current={c.name} />
        <div className="flex min-w-0 flex-col gap-[var(--site-gap)]">
          {/* Below 1024px only, where the list beside the page doesn't fit. The label
              says what the menu holds, counted from the list, and the page you're on
              is checked, on the selection ground (owner, 2026-10-27). The check sits
              in Menu's leading indicator slot, as a checkbox item's does, so every
              title starts at the same x. */}
          <Menu>
            <MenuTrigger
              render={
                <Button variant="outline" className="self-start lg:hidden">
                  All {built.length} components
                  <CaretDownIcon />
                </Button>
              }
            />
            <MenuContent>
              {built.map((b) => {
                const current = b.name === c.name;
                return (
                  <MenuItem
                    key={b.name}
                    render={<a href={componentPage(b.name)} aria-current={current ? 'page' : undefined} />}
                    className={current ? 'bg-bg-interactive' : undefined}
                  >
                    <span className="flex w-[var(--size-icon-sm)] shrink-0 items-center justify-center">
                      {current ? <CheckIcon weight="bold" aria-hidden="true" /> : null}
                    </span>
                    {b.title}
                  </MenuItem>
                );
              })}
            </MenuContent>
          </Menu>

          <div className="flex flex-col gap-[var(--gap-group)]">
            <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">{c.title}</h1>
            <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">{c.decision}</p>
          </div>

          <div className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-2">
            <WhenList id="use-when" title="Use it when" lines={c.useWhen} />
            <WhenList id="avoid-when" title="Don’t use it when" lines={c.avoidWhen} />
          </div>

          <RulesFollowed name={c.name} />

          <section aria-labelledby="pair-title">
            {/* Hidden, not absent: a component's own heading inside the pair (AgentPlan's
              <h3>) must not follow the page's <h1> with a level skipped. Semibold
              like every heading, so it draws from the preloaded serif and doesn't fetch
              the 400 file (index.css). */}
            <h2 id="pair-title" className="sr-only font-semibold">
              Before and after
            </h2>
            <ComponentPair name={c.name} />
          </section>

          <div className="flex flex-col gap-[var(--gap-group)]">
            <h2 className="text-site-title font-semibold text-text-primary">Install</h2>
            <CopyCommand command={install(c.name)} />
            <h3 className="pt-[var(--gap-inline)] text-site-small font-semibold text-text-primary">Usage</h3>
            <CodeView language="tsx" label={`${c.title} usage`}>
              {usage(c.name)}
            </CodeView>
            <p className="flex flex-wrap gap-x-[var(--site-gap)] gap-y-[var(--gap-inline)] text-site-small text-text-secondary">
              <a href={pages.gettingStarted.href} className={`${standaloneLink} text-text-body`}>
                Set up your app first
              </a>
              <a href={storybookDocs(c.name)} className={`${standaloneLink} text-text-body`}>
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
              <a href={componentPage(previous.name)} className={`${neighbour} flex flex-col`}>
                <span className="text-site-small text-text-secondary">Previous</span>
                <span className={neighbourTitle}>{previous.title}</span>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={componentPage(next.name)} className={`${neighbour} flex flex-col items-end text-right`}>
                <span className="text-site-small text-text-secondary">Next</span>
                <span className={neighbourTitle}>{next.title}</span>
              </a>
            ) : null}
          </nav>
        </div>
      </Rail>
    </Section>
  );
}
