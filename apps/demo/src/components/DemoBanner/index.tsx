import { useState } from 'react';
import { InfoIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  TruncatedText,
  buttonVariants,
} from 'tabular-ui';

import { kasaneCompany, visitor } from '../../lib/kasane';

const STORYBOOK_URL = 'https://storybook.tabularui.com';
const PORTFOLIO_URL = 'https://pascalchenier.com';

/**
 * The line that tells a visitor where they are: a demo, played as Kasane's
 * Head of FP&A, in a channel whose people and agent are scripted. It sits in
 * the top nav, between the sidebar toggle and the trailing edge, so the shell
 * keeps its full height. Neutral throughout: being a demo is context, not a
 * state of the data (§0 rule 1). App-local: only the public demo needs it.
 */
export function DemoBanner() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div
      data-slot="demo-banner"
      className="flex min-w-0 flex-1 items-center gap-[var(--gap-inline)] text-sm text-text-secondary"
    >
      <Badge>Demo</Badge>
      <TruncatedText side="bottom">{`You’re ${visitor.name}, ${visitor.title} at ${kasaneCompany.legalName}, a fictional company. The people and the agent are scripted.`}</TruncatedText>
      <span className="flex-1" />
      <Button size="sm" variant="ghost" onClick={() => setAboutOpen(true)}>
        <InfoIcon aria-hidden="true" />
        About this demo
      </Button>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About this demo</DialogTitle>
            <DialogDescription>
              The month-end close of an AI finance tool, built from Tabular UI&rsquo;s components.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
            <p>
              <span className="font-medium text-text-primary">The company is fictional.</span> {kasaneCompany.legalName}{' '}
              makes stencil duplicators and inkjet printers in Tokyo and sells through subsidiaries in the US, Germany,
              the UK and China. Its people, customers and numbers were generated, and its books balance to the yen.
            </p>
            <p>
              <span className="font-medium text-text-primary">The people and the agent are scripted.</span> Every figure
              they quote is computed from Kasane&rsquo;s books. You make one decision, and only what it touches changes.
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
