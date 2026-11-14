import { useState } from 'react';
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

const whoYouAre = `You’re ${visitor.name}, ${visitor.title} at ${kasaneCompany.legalName}, a fictional company. The people and the agents are scripted.`;

/**
 * About this demo, and its dialog: what is fictional, what is scripted, what is
 * real, and the demo's only links out to the components. It has to stay on
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About this demo</DialogTitle>
          <DialogDescription>
            The month-end close of an AI finance tool, built from Tabular UI&rsquo;s components.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[var(--gap-field)] text-sm text-text-body">
          <p>{whoYouAre}</p>
          <p>
            <span className="font-medium text-text-primary">The company is fictional.</span> {kasaneCompany.legalName}{' '}
            makes stencil duplicators and inkjet printers in Tokyo and sells through subsidiaries in the US, Germany,
            the UK and China. Its people, customers and numbers were generated, and its books balance to the yen.
          </p>
          <p>
            <span className="font-medium text-text-primary">The people and the agents are scripted.</span> Every figure
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
