import { Fragment, useState } from 'react';
import { ArrowCounterClockwiseIcon, FastForwardIcon, InfoIcon } from '@phosphor-icons/react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  buttonVariants,
} from 'tabular-ui';

import { sceneNow } from '../../lib/clock';
import { useClose } from '../../lib/close-context';
import { kasaneCompany, visitor } from '../../lib/kasane';
import { AI_COMPONENTS_URL, STORYBOOK_URL } from '../../lib/links';
import { useStartOver } from '../../lib/start-over';

/**
 * What the dialog sorts the demo into, one row each: the kind first, so a
 * visitor can read the three words and stop.
 */
const whatIsWhat = [
  {
    kind: 'Fictional',
    what: `${kasaneCompany.name}, its people and its numbers. The books balance to the yen, and every figure quoted is computed from them.`,
  },
  {
    kind: 'Scripted',
    what: 'The people and the agents. You make one decision, and only what it touches changes.',
  },
  {
    kind: 'Real',
    what: 'The interface. Every screen is built from Tabular UI, a design system for dense finance and data tools.',
  },
];

/**
 * About this demo, and its dialog: who the visitor plays, what is fictional,
 * scripted and real, and the demo's only links out to the components. It has to stay on
 * screen, so it's in the sidebar's row and, while the sidebar is collapsed, in
 * the top nav.
 */
export function AboutDemoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="ghost" className={className} onClick={() => setOpen(true)}>
        <InfoIcon aria-hidden="true" />
        About this demo
      </Button>
      <AboutDemoDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * The About dialog on its own, for a control that isn't About's button: the
 * workspace switcher opens it for the companies and the create flow the demo
 * doesn't have (`shell/Sidebar.tsx`).
 */
export function AboutDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Since 2026-11-16: 16px in place of Dialog's 12px (--pad-panel), so the edge sits further
        from the text than the rows sit from each other. No token names a dialog's padding yet.
      */}
      <DialogContent className="p-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About this demo</DialogTitle>
          <DialogDescription>
            You play {visitor.name}, {visitor.title} at {kasaneCompany.legalName}, in its month-end close.
          </DialogDescription>
        </DialogHeader>
        {/* Confirmation's grid: the kind in its own column, so the three rows scan as a list. */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-[var(--gap-group)] gap-y-[var(--gap-group)] text-sm">
          {whatIsWhat.map(({ kind, what }) => (
            <Fragment key={kind}>
              <dt className="font-medium text-text-primary">{kind}</dt>
              <dd className="text-text-body">{what}</dd>
            </Fragment>
          ))}
        </dl>
        {/* Wraps: the two links are 314px on one row, and a 375px screen leaves the footer 309px. */}
        <DialogFooter className="flex-wrap">
          <a className={buttonVariants({ variant: 'outline' })} href={STORYBOOK_URL} target="_blank" rel="noreferrer">
            Open Storybook
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a className={buttonVariants()} href={AI_COMPONENTS_URL} target="_blank" rel="noreferrer">
            Browse the AI components
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The demo's own controls, one row at the foot of the sidebar: About, Skip and
 * Start over. One row because the nav already overflows at 1280×720. Neutral
 * throughout: being a demo is context, not a state of the data (§0 rule 1).
 * App-local: only the public demo needs it.
 */
export function DemoActions() {
  const { state, dispatch } = useClose();
  const startOver = useStartOver();

  return (
    <div data-slot="demo-actions" className="flex items-center gap-[var(--gap-bonded)]">
      {/* A nav item's padding, in place of Button's 6px beside an icon, so the icon lines up with the nav's. */}
      <AboutDemoButton className="pl-[var(--pad-sidebar-item)]" />
      <span className="flex-1" />
      {/*
        Skip and Start over work at any point (the plan, §5). Skip is disabled at
        the end rather than hidden, so the row doesn't shift under the pointer;
        Start over is always there.
      */}
      <IconButton
        size="sm"
        aria-label="Skip to the end"
        disabled={state.ended}
        onClick={() => dispatch({ type: 'skip', at: sceneNow() })}
      >
        <FastForwardIcon />
      </IconButton>
      <IconButton size="sm" aria-label="Start over" onClick={startOver}>
        <ArrowCounterClockwiseIcon />
      </IconButton>
    </div>
  );
}
