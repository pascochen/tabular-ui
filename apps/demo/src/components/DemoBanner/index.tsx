import { useState } from 'react';
import { ArrowCounterClockwiseIcon, FastForwardIcon, InfoIcon } from '@phosphor-icons/react';
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

import { sceneNow } from '../../lib/clock';
import { useClose } from '../../lib/close-context';
import { kasaneCompany, visitor } from '../../lib/kasane';
import { AI_COMPONENTS_URL, STORYBOOK_URL } from '../../lib/links';
import { useStartOver } from '../../lib/start-over';
import { useCompactBar } from '../../lib/viewport';

const whoYouAre = `You’re ${visitor.name}, ${visitor.title} at ${kasaneCompany.legalName}, a fictional company. The people and the agent are scripted.`;

/**
 * The line that tells a visitor where they are: a demo, played as Kasane's
 * Head of FP&A, in a channel whose people and agent are scripted. It sits in
 * the top nav, between the sidebar toggle and the trailing edge, so the shell
 * keeps its full height. Neutral throughout: being a demo is context, not a
 * state of the data (§0 rule 1). App-local: only the public demo needs it.
 */
export function DemoBanner() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { state, dispatch } = useClose();
  const startOver = useStartOver();
  const compact = useCompactBar();

  return (
    <div
      data-slot="demo-banner"
      // --h-control: a shell band's height is its child's plus 8px each side
      // and the rule (§7.4). The buttons here are 24px, so without this the
      // top nav is 41px, its rule 8px above the sidebar header's.
      className="flex min-h-[var(--h-control)] min-w-0 flex-1 items-center gap-[var(--gap-inline)] text-sm text-text-secondary"
    >
      {/* Under 360px the three buttons need its room. About this demo still says it. */}
      <Badge className="max-[22.5rem]:hidden">Demo</Badge>
      {/* No room for it on a phone, where it would cut to "Y…". About this demo says it instead. */}
      {compact ? null : <TruncatedText side="bottom">{whoYouAre}</TruncatedText>}
      <span className="flex-1" />
      {/*
        Skip and Start over work at any point (the plan, §5). Skip is disabled at
        the end rather than hidden, so the bar doesn't shift under the
        pointer; Start over is always there.
      */}
      <Button
        size="sm"
        variant="ghost"
        disabled={state.ended}
        // The accessible name stays whole, and starts with what the bar shows.
        aria-label={compact ? 'Skip to the end' : undefined}
        onClick={() => dispatch({ type: 'skip', at: sceneNow() })}
      >
        <FastForwardIcon aria-hidden="true" />
        {compact ? 'Skip' : 'Skip to the end'}
      </Button>
      <Button size="sm" variant="ghost" onClick={startOver}>
        <ArrowCounterClockwiseIcon aria-hidden="true" />
        Start over
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label={compact ? 'About this demo' : undefined}
        onClick={() => setAboutOpen(true)}
      >
        <InfoIcon aria-hidden="true" />
        {compact ? 'About' : 'About this demo'}
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
            {compact ? <p>{whoYouAre}</p> : null}
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
            <a className={buttonVariants({ variant: 'outline' })} href={STORYBOOK_URL} target="_blank" rel="noreferrer">
              Storybook
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a className={buttonVariants()} href={AI_COMPONENTS_URL} target="_blank" rel="noreferrer">
              Browse the AI components
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
