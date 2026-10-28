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
    description: 'Install Tabular UI from npm, or copy the components’ source into your app with the shadcn registry.',
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
            Two ways in: install the package from npm, or copy the components’ source into your app with the shadcn
            registry. Both need React 19 and Tailwind CSS 4.
          </p>
        </Rail>
      </Section>

      <Section labelledBy="npm-title">
        <Rail size="reading" className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader id="npm-title" title="Install the package" />
          <ol role="list" className="flex flex-col gap-[var(--site-gap)]">
            <Step title="Install">
              <Code heading="Install" label="Install command" />
              <p className={prose}>
                Tailwind CSS 4.1 or later must already be set up in the app; for Vite, with @tailwindcss/vite.
              </p>
            </Step>
            <Step title="Set up the stylesheet">
              <p className={prose}>
                The package ships its CSS as Tailwind source, compiled by your app’s Tailwind. Replace your stylesheet’s
                own Tailwind import with these two lines. The second lets Tailwind see the classes the components use;
                its path is relative to the stylesheet.
              </p>
              <Code heading="Set up the stylesheet" label="Stylesheet" />
            </Step>
            <Step title="Set up the app root">
              <p className={prose}>
                Call useTheme() once at the root for the colour mode, and put one TooltipProvider above every icon-only
                control.
              </p>
              <Code heading="Set up the app root" label="App root" />
            </Step>
            <Step title="Use">
              <Code heading="Use" label="Usage" />
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

      <Section labelledBy="registry-title">
        <Rail size="reading" className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="registry-title"
            title="Or copy the source with shadcn"
            lead="For apps that want the components in their own repository. The app must already be a shadcn project: Tailwind 4, the @/ alias, and a components.json from shadcn init."
          />
          <ol role="list" className="flex flex-col gap-[var(--site-gap)]">
            <Step title="Add components">
              <Code heading="Or copy the source with shadcn" index={0} label="Registry commands" />
              <p className={prose}>
                Files land under components/tabular-ui/, and your own lib/utils is never replaced. With everything
                added, imports read from one index; a single component is imported from its own folder.
              </p>
              <Code heading="Or copy the source with shadcn" index={1} label="Importing one component" />
            </Step>
            <Step title="Add the tokens">
              <Code heading="Or copy the source with shadcn" index={2} label="Stylesheet" />
              <p className={prose}>
                The tokens bring the fonts, the animations, Base UI’s state variants and a base layer, so delete the
                copies shadcn init wrote: its :root, .dark, @theme inline and @custom-variant dark blocks, its @layer
                base block (it halves the focus ring), and its shadcn/tailwind.css, font and tw-animate-css imports.
              </p>
            </Step>
            <Step title="Theme and tooltips">
              <p className={prose}>Without everything added, useTheme and TooltipProvider come from their own items.</p>
              <Code heading="Or copy the source with shadcn" index={3} label="Theme and tooltip items" />
            </Step>
          </ol>
        </Rail>
      </Section>
    </>
  );
}
