import { useState } from 'react';
import { ArrowCounterClockwiseIcon, InfoIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  buttonVariants,
} from 'tabular-ui';

import { kasaneCompany } from '../../lib/kasane';

const STORYBOOK_URL = 'https://storybook.tabularui.com';
const PORTFOLIO_URL = 'https://pascalchenier.com';

export type DemoBannerProps = {
  /** Clears the run and the files, back to the empty dropzone. */
  onStartOver: () => void;
};

/**
 * The one line that tells a visitor where they are: a demo, played as Kasane's
 * Head of FP&A, with a fictional company's files. Neutral throughout: being a
 * demo is context, not a state of the data (§0 rule 1). Journey-local, like
 * `StageTracker`.
 */
export function DemoBanner({ onStartOver }: DemoBannerProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { persona } = kasaneCompany;

  return (
    <div
      data-slot="demo-banner"
      // py-1 (4px) is wrap clearance, not rhythm: on a narrow window the line
      // breaks, and the rows need a gap from the band's edges (§7.4 fallback).
      className="flex min-h-[var(--h-row-sm)] flex-wrap items-center gap-x-[var(--gap-inline)] border-b border-border bg-surface px-[var(--pad-page-x)] py-1 text-sm text-text-secondary"
    >
      <Badge>Demo</Badge>
      <span className="min-w-0">
        You&rsquo;re {persona.name}, {persona.title} at {kasaneCompany.legalName}, a fictional company.
      </span>
      {/* Below 1024px the dense layout still works, but it was drawn for a laptop. */}
      <span className="lg:hidden">Built for laptop screens.</span>
      <span className="flex-1" />
      <Button size="sm" variant="ghost" onClick={() => setAboutOpen(true)}>
        <InfoIcon aria-hidden="true" />
        About this demo
      </Button>
      <Button size="sm" variant="ghost" onClick={onStartOver}>
        <ArrowCounterClockwiseIcon aria-hidden="true" />
        Start over
      </Button>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About this demo</DialogTitle>
            <DialogDescription>
              The onboarding flow of an AI finance tool, built from Tabular UI&rsquo;s components.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
            <p>
              <span className="font-medium text-text-primary">The company is fictional.</span> {kasaneCompany.legalName}{' '}
              makes stencil duplicators and inkjet printers in Tokyo and sells through subsidiaries in the US, Germany,
              the UK and China. Its people, customers and numbers were generated, and its books balance to the yen.
            </p>
            <p>
              <span className="font-medium text-text-primary">The agent is scripted.</span> Every finding it shows is
              computed from the files you load, so it cannot invent a number. Load your own files and the flow still
              runs, with no findings: the script only knows Kasane&rsquo;s material.
            </p>
            <p>
              <span className="font-medium text-text-primary">The interface is real.</span> Every control, colour and
              spacing on these screens comes from Tabular UI, a design system for dense finance and data tools.
            </p>
          </div>
          <DialogFooter>
            <a className={buttonVariants({ variant: 'outline' })} href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
              Designer&rsquo;s portfolio
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a className={buttonVariants()} href={STORYBOOK_URL} target="_blank" rel="noreferrer">
              Browse the components
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
