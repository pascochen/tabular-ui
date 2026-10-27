import { buttonVariants } from 'tabular-ui';

import { DemoAction } from './components/demo-action';
import { Rail, Section } from './components/layout';
import { SpecimenFrame } from './components/specimen';
import { componentGrid, pages } from './content';
import { kasane } from './data';
import { HeroSpecimen } from './specimens';

/** Home's hero and closing band (wireframe `76:23`, mobile `77:96`). The component grid between them is in component-grid.tsx. */

/**
 * The hero's one specimen sits on a paper plate on a sheet ruled like a
 * spreadsheet (D3, item 3). The rules are a decorative layer behind the
 * content, styled in index.css: one empty element per column, whose border
 * is the column's line.
 */
const sheetColumns = Array.from({ length: 36 }, (_, i) => i);

export function HeroSection() {
  return (
    <Section rule={false} labelledBy="hero-title" className="relative isolate">
      <div aria-hidden="true" className="site-sheet pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Rail className="h-full">
          <div className="relative h-full">
            <div className="site-sheet-rules absolute inset-y-0">
              {sheetColumns.map((i) => (
                <div key={i} />
              ))}
            </div>
          </div>
        </Rail>
      </div>
      <Rail className="grid grid-cols-1 items-start gap-[var(--site-gap)] lg:grid-cols-12">
        <div className="flex flex-col gap-[var(--site-gap)] lg:col-span-5">
          <h1 id="hero-title" className="text-site-display-sm font-semibold text-text-primary md:text-site-display">
            An agent stops before anything that posts to the ledger.
          </h1>
          <p className="text-site-lead text-text-secondary">
            Proposals are cheap. Journal entries are not. Only a person can release one.
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
        <SpecimenFrame className="bg-canvas lg:col-span-7">
          <HeroSpecimen />
        </SpecimenFrame>
      </Rail>
    </Section>
  );
}

/**
 * The closing band (D7): Home only, and dark (D3, decided (c)): a section set to
 * data-theme="dark", so every token recomputes inside it, with its own ground
 * and text colour. No tint, no new token.
 */
export function ClosingBand() {
  return (
    <Section labelledBy="closing-title" className="p-0">
      <div data-theme="dark" className="bg-canvas py-[var(--site-section-y)] text-text-body">
        <Rail size="reading" className="flex flex-col items-center gap-[var(--site-gap)] text-center">
          <h2 id="closing-title" className="text-site-heading-sm font-semibold text-text-primary md:text-site-heading">
            Give an agent a finance team’s files.
          </h2>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">
            {kasane.company.name} is a fictional printer maker. You play its {kasane.company.persona.title} while a
            scripted agent reads {kasane.pack.length} of its files. The duplicate payment above is one of the
            contradictions it finds.
          </p>
          <DemoAction label="Open the demo" />
        </Rail>
      </div>
    </Section>
  );
}
