import readme from '../../../../packages/ui/README.md?raw';
import { CodeView } from 'tabular-ui';

import { ExternalMark, Rail, Section, SectionHeader } from '../components/layout';
import { external } from '../content';
import { textLink } from '../lib/styles';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/getting-started';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Getting started · Tabular UI',
    description: 'Copy Tabular UI’s components into your app with the shadcn registry, then add the tokens.',
    path: '/getting-started',
  });

/**
 * The code on this page is read from packages/ui/README.md at build time, by
 * section, so the page and the README can't give different commands. A section
 * renamed or emptied fails the build. The prose around it is the site's own.
 */
function blocks(heading: string): { lang: string; code: string }[] {
  const start = readme.indexOf(`\n## ${heading}\n`);
  if (start < 0) throw new Error(`packages/ui/README.md has no "## ${heading}" section`);
  const end = readme.indexOf('\n## ', start + 1);
  const section = readme.slice(start, end < 0 ? undefined : end);
  const found = [...section.matchAll(/```(\w*)\n([\s\S]*?)```/g)].map((m) => ({ lang: m[1], code: m[2].trimEnd() }));
  if (found.length === 0) throw new Error(`packages/ui/README.md's "${heading}" section has no code block`);
  return found;
}

function Code({ heading, index = 0, label }: { heading: string; index?: number; label: string }) {
  const block = blocks(heading)[index];
  if (!block) throw new Error(`packages/ui/README.md's "${heading}" section has no code block ${index}`);
  return (
    <CodeView language={block.lang} label={label}>
      {block.code}
    </CodeView>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-[var(--gap-group)] border-t border-border pt-[var(--site-gap)]">
      <h3 className="text-site-title font-semibold text-text-primary">{title}</h3>
      {children}
    </li>
  );
}

const prose = 'max-w-[var(--site-w-prose)] text-site-body text-text-body';

export default function GettingStarted() {
  return (
    <>
      <Section rule={false}>
        <Rail size="reading" className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">Getting started</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">
            Tabular UI installs as source: the shadcn registry copies each component into your app, where you own it.
            The app needs React 19, Tailwind CSS 4 and a components.json from shadcn init.
          </p>
        </Rail>
      </Section>
      <Section labelledBy="setup-title">
        <Rail size="reading" className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="setup-title"
            title="Set up with shadcn"
            lead="Four steps, once per app. After that, each component page gives the one command that adds it."
          />
          <ol role="list" className="flex flex-col gap-[var(--site-gap)]">
            <Step title="Add components">
              <Code heading="Install" label="Registry commands" />
              <p className={prose}>
                Files land under components/tabular-ui/, and your own lib/utils is never replaced. Each component brings
                what it imports.
              </p>
            </Step>
            <Step title="Add the tokens">
              <Code heading="Set up the stylesheet" label="Stylesheet" />
              <p className={prose}>
                The tokens bring the fonts, the animations, Base UI’s state variants and a base layer, so delete the
                copies shadcn init wrote: its :root, .dark, @theme inline and @custom-variant dark blocks, its @layer
                base block (it halves the focus ring), and its shadcn/tailwind.css, font and tw-animate-css imports.
                Then remove the packages it installed for them.
              </p>
              <Code heading="Set up the stylesheet" index={1} label="Packages to remove" />
            </Step>
            <Step title="Set up the app root">
              <p className={prose}>
                Call useTheme() once at the root for the colour mode, and put one TooltipProvider above every icon-only
                control.
              </p>
              <Code heading="Set up the app root" label="App root" />
              <p className={prose}>Without everything added, useTheme and TooltipProvider come from their own items.</p>
              <Code heading="Set up the app root" index={1} label="Theme and tooltip items" />
            </Step>
            <Step title="Use">
              <p className={prose}>With everything added, imports read from one index.</p>
              <Code heading="Use" label="Usage" />
              <p className={prose}>A single component is imported from its own folder.</p>
              <Code heading="Use" index={1} label="Importing one component" />
              <p className={prose}>
                Every component, its props and its states are in{' '}
                <a href={external.storybook.href} className={textLink}>
                  {external.storybook.label}
                  <ExternalMark />
                </a>
                . In a Next.js App Router project, render them from a file marked ‘use client’.
              </p>
            </Step>
          </ol>
        </Rail>
      </Section>
    </>
  );
}
