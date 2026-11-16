import { buttonVariants } from 'tabular-ui';

import { DemoAction } from './components/demo-action';
import { Rail, Section } from './components/layout';
import { SpecimenFrame } from './components/specimen';
import { componentGrid, pages } from './content';
import { closingBand, kasane } from './data';
import { HeroSpecimen } from './specimens';

/** Home's hero and closing band (wireframe `76:23`, mobile `77:96`). The component grid between them is in component-grid.tsx. */

/**
 * The hero: the headline and its actions beside one specimen, centred against
 * it (decided 2026-11-16). The page under it is the plain warm white, and the
 * ruled sheet that sat behind it until then is gone (D3, item 3). The paper's
 * tooth, which covered the whole page until then, is on the specimen's frame
 * alone (D3, item 4).
 */
export function HeroSection() {
  return (
    <Section rule={false} labelledBy="hero-title">
      <Rail className="grid grid-cols-1 items-center gap-[var(--site-gap)] lg:grid-cols-12">
        <div className="flex flex-col gap-[var(--site-gap)] lg:col-span-5">
          <h1
            id="hero-title"
            className="text-site-display-sm font-semibold text-balance text-text-primary md:text-site-display"
          >
            A design system for the human in the loop
          </h1>
          <p className="text-site-lead text-text-secondary">
            Components that show how the agent reasoned, what it proposes and what a person approved.
          </p>
          <div className="flex flex-wrap gap-[var(--gap-inline)]">
            <DemoAction label="Open the demo" />
            {pages.components.live ? (
              <a href={componentGrid} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                Browse components
              </a>
            ) : null}
          </div>
        </div>
        <SpecimenFrame grain className="lg:col-span-7">
          <HeroSpecimen />
        </SpecimenFrame>
      </Rail>
    </Section>
  );
}

/**
 * The closing band (D7): Home only, and dark (D3, decided (c)): a section set to
 * data-theme="dark", so every token recomputes inside it, with its own ground
 * and text colour. It's ink on paper, so a sheet's tooth shows through it
 * (`site-ink`, D3). No new token.
 */
export function ClosingBand() {
  return (
    <Section labelledBy="closing-title" className="p-0">
      <div data-theme="dark" className="site-ink relative isolate bg-canvas py-[var(--site-section-y)] text-text-body">
        <Rail size="reading" className="flex flex-col items-center gap-[var(--site-gap)] text-center">
          <h2
            id="closing-title"
            className="text-site-heading-sm font-medium text-balance text-text-primary md:text-site-heading"
          >
            {closingBand.agents} agents checked a finance team’s books and raised {closingBand.findings} issues for you
            to decide
          </h2>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-balance text-text-secondary">
            {kasane.company.name} is a fictional printer maker. Its team works in channels, like Slack, and you play its{' '}
            {closingBand.role}.
          </p>
          <DemoAction label="Open the demo" />
        </Rail>
      </div>
    </Section>
  );
}
