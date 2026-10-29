import { CaretRightIcon, XCircleIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { Spinner } from '../../foundational/Spinner';
import { useAnnouncement } from '../announcement';
import { WorkingLabel } from '../workingLabel';

export type ToolStatus = 'running' | 'done' | 'failed';

/**
 * One call the agent made: a file read, a search, a query. Each state carries
 * its own words, so the past tense can only show once the call has run, and a
 * failure can't show without its next step.
 */
export type ToolCall = {
  /**
   * While it runs, the action in the present: "Reading
   * `supplier_invoices_fy2026_h1.csv`". No ellipsis: the line adds it, then
   * the elapsed figure after 3s (§11.5).
   */
  running: React.ReactNode;
  /** When the call began, epoch ms, so a reload carries the figure on. */
  startedAt?: number;
} & (
  | {
      status: 'running' | 'done';
      /**
       * Once it has run, the action in the past: "Read
       * `supplier_invoices_fy2026_h1.csv`". Shown only when `status` is
       * `done`.
       */
      done: React.ReactNode;
      /** What the call read or returned. The line opens to it, and never by itself. */
      detail?: React.ReactNode;
    }
  | {
      status: 'failed';
      /** What failed, and why if known: "Couldn't match … to fields: it has no header row." */
      error: React.ReactNode;
      /**
       * What happens next, in the agent's words: "I'll take both payments as
       * the invoice file records them." Required: a failure says what to do
       * next. Always visible.
       */
      next: React.ReactNode;
    }
);

type Disclosure = {
  /** Controlled open state. Omit to let the component hold it. */
  open?: boolean;
  /** Folded by default, running or not. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export type ToolProps = ToolCall & Disclosure;

export type ToolGroupProps = Disclosure & {
  /** Calls the agent made in a row, in order. Each needs a stable `id`. */
  calls: readonly (ToolCall & { id: string })[];
  /**
   * What the line says once every call has run, in the past: "Read 3 files".
   * While one runs, the line says what that one is doing instead.
   */
  summary: React.ReactNode;
};

function useDisclosure({ open, defaultOpen = false, onOpenChange }: Disclosure) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;
  const setOpen = (next: boolean) => {
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };
  return [isOpen, setOpen] as const;
}

/** The caret's slot: 1em plus the button's icon gap, so text lines up under a label. */
const slot = 'pl-[calc(1em+var(--gap-control-icon))]';

/**
 * The line's type, as `AgentReasoning`'s summary: metadata, so secondary (§3),
 * `--text-sm`, weight 500.
 */
const lineText = 'text-sm font-medium text-text-secondary';

/**
 * A line wraps rather than run past a phone's panel: a verb and a file name
 * can be wider than 250px. `Button` is `whitespace-nowrap`, so this undoes it,
 * and a name with no spaces breaks where it must. `wrap-anywhere`, not
 * `wrap-break-word`: only `anywhere` lowers the label's minimum width, so a
 * file name wider than a group's row can't overflow it. `Button` centres its
 * content, and an overflowing label pushed the caret 6px left of its
 * neighbours' (measured on the site, 2026-10-28). Content starts at the left.
 */
const wraps = 'max-w-full justify-start whitespace-normal text-start wrap-anywhere';

/** Holds an icon to the first line, centred on it, when the label wraps. */
const firstLine = 'flex h-lh shrink-0 items-center';

/**
 * The line: a disclosure when there is something to open, else plain text.
 * Its label and its spinner are what the call says in its current state.
 */
function Line({
  label,
  working,
  startedAt,
  workKey,
  open,
  onToggle,
  contentId,
  indent,
}: {
  label: React.ReactNode;
  working: boolean;
  startedAt?: number;
  /** Keys the elapsed figure to the call, so it starts again at the next one. */
  workKey?: string;
  open?: boolean;
  onToggle?: () => void;
  contentId?: string;
  /** Holds the caret's slot when there's no caret, so a group's rows line up. */
  indent?: boolean;
}) {
  const text = (
    <span className="min-w-0">
      {working ? <WorkingLabel key={workKey} label={label} startedAt={startedAt} /> : label}
    </span>
  );
  // §5 "AI working": the Spinner, the colour of its label (§11.1). Under
  // reduced motion it stands still, and the figure keeps counting. Held to the
  // first line's height, as the caret is, when a long name wraps the label.
  const spinner = working ? (
    <span className={firstLine}>
      <Spinner />
    </span>
  ) : null;

  if (!onToggle) {
    return (
      <p className={cn('flex items-start gap-[var(--gap-control-icon)] tabular-nums', lineText, wraps, indent && slot)}>
        {text}
        {spinner}
      </p>
    );
  }
  return (
    <Button
      variant="inline"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={onToggle}
      className={cn(
        'items-start gap-[var(--gap-control-icon)] tabular-nums hover:text-text-body',
        lineText,
        wraps,
        // AgentReasoning's recipe: `inline` hides the hover fill, and nothing
        // here owns hover, so it comes back, padded and cancelled by an equal
        // negative margin, so the caret and label stay where they were.
        'cursor-pointer after:block',
        'px-1.5 py-0.5 -mx-1.5 -my-0.5',
      )}
    >
      {/* Same 1em, bold caret as AgentReasoning and RunLogRow. Button sets bold. */}
      <span className={firstLine}>
        <CaretRightIcon
          aria-hidden="true"
          className={cn('transition-transform motion-reduce:transition-none', open && 'rotate-90')}
        />
      </span>
      {text}
      {spinner}
    </Button>
  );
}

/**
 * A failed call. Never folded: what failed and what happens next are the
 * line. The icon sits in the caret's slot, so the text lines up with every
 * label around it. Colour is never alone (§11.1): the icon's shape and the
 * words say it failed too.
 */
function Failure({ error, next }: { error: React.ReactNode; next: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1em_1fr] gap-x-[var(--gap-control-icon)] text-sm wrap-anywhere">
      <span className={cn(firstLine, 'text-text-danger')}>
        {/* §11.2: bold is the floor at this size. RunLogRow's failed icon. */}
        <XCircleIcon aria-hidden="true" weight="bold" className="size-[1em]" />
      </span>
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <p className="font-medium text-text-body">{error}</p>
        <p className="text-text-secondary">{next}</p>
      </div>
    </div>
  );
}

/**
 * What a line opens to: under the label, as `AgentReasoning`'s content. What a
 * call read is often figures, so they're tabular here (§0 rule 7).
 */
function Detail({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className={cn('mt-[var(--gap-field)] text-sm whitespace-pre-wrap text-text-secondary tabular-nums', slot)}
    >
      {children}
    </div>
  );
}

/** One call, as a line in a group or on its own. */
function Call({ call, indent }: { call: ToolCall; indent?: boolean }) {
  const [open, setOpen] = useDisclosure({});
  const contentId = useId();
  if (call.status === 'failed') return <Failure error={call.error} next={call.next} />;
  const hasDetail = call.detail != null;
  return (
    <div className="flex flex-col items-start">
      <Line
        label={call.status === 'running' ? call.running : call.done}
        working={call.status === 'running'}
        startedAt={call.startedAt}
        open={open}
        onToggle={hasDetail ? () => setOpen(!open) : undefined}
        contentId={contentId}
        indent={indent && !hasDetail}
      />
      {hasDetail && open ? <Detail id={contentId}>{call.detail}</Detail> : null}
    </div>
  );
}

/**
 * Tool — product. One call the agent made, as one line: what it's doing while
 * it runs, what it did once it has run, and what failed and what happens next
 * when it fails. `ToolGroup` folds calls made in a row into one line.
 *
 * **A part of an `AgentBlock`, not a block of its own**, like
 * `AgentReasoning`. The block carries the rail and the authorship label.
 *
 * **Done only after it ran.** The past tense is its own prop, shown only when
 * `status` is `done`, so a running call can't read as finished.
 *
 * **Folded, and it never opens or closes by itself** (AgentReasoning's rule):
 * a line opens to `detail` only when the reader asks. A failure is never
 * folded: its error and next step are always visible.
 */
function Tool({ open, defaultOpen, onOpenChange, className, ...call }: ToolProps) {
  const [isOpen, setOpen] = useDisclosure({ open, defaultOpen, onOpenChange });
  const contentId = useId();
  // Running isn't news: the line says it. Finishing and failing are.
  const live = useAnnouncement(call.status === 'running' ? '' : call.status, call.status !== 'running');

  let body: React.ReactNode;
  if (call.status === 'failed') {
    body = <Failure error={call.error} next={call.next} />;
  } else {
    const hasDetail = call.detail != null;
    body = (
      <>
        <Line
          label={call.status === 'running' ? call.running : call.done}
          working={call.status === 'running'}
          startedAt={call.startedAt}
          open={isOpen}
          onToggle={hasDetail ? () => setOpen(!isOpen) : undefined}
          contentId={contentId}
        />
        {hasDetail && isOpen ? <Detail id={contentId}>{call.detail}</Detail> : null}
      </>
    );
  }

  return (
    <div data-slot="tool" data-status={call.status} className={cn('flex flex-col items-start', className)}>
      {body}
      {/*
        Beside the line, not in it: inside the button it would join the
        name. Holds the change for ANNOUNCEMENT_MS, then empties.
      */}
      <span role="status" className="sr-only">
        {live === 'done' && call.status === 'done' ? call.done : null}
        {live === 'failed' && call.status === 'failed' ? (
          <>
            {call.error} {call.next}
          </>
        ) : null}
      </span>
    </div>
  );
}

/**
 * ToolGroup — calls the agent made in a row, folded into one line: "Read 3
 * files". While a call runs, the line says what that call is doing, so the
 * summary's past tense shows only once every call has run. Opened, it lists
 * each call as its own line. A failed call's line shows under the group's
 * whether it's open or not.
 */
function ToolGroup({ calls, summary, open, defaultOpen, onOpenChange, className }: ToolGroupProps) {
  const [isOpen, setOpen] = useDisclosure({ open, defaultOpen, onOpenChange });
  const contentId = useId();
  const current = calls.find((c) => c.status === 'running');
  const failed = calls.filter((c) => c.status === 'failed');
  const shown = isOpen ? calls : failed;

  // News: the group finishing, and each failure as it lands.
  const message = [current ? '' : 'done', ...failed.map((c) => c.id)].filter(Boolean).join(' ');
  const live = useAnnouncement(message, !current);

  return (
    <div
      data-slot="tool-group"
      data-status={current ? 'running' : failed.length ? 'failed' : 'done'}
      className={cn('flex flex-col items-start', className)}
    >
      <Line
        label={current ? current.running : summary}
        working={current != null}
        startedAt={current?.startedAt}
        workKey={current?.id}
        open={isOpen}
        onToggle={() => setOpen(!isOpen)}
        contentId={contentId}
      />
      {/*
        Always in the page, so `aria-controls` points at something; empty
        while folded with nothing failed.
      */}
      <ul
        id={contentId}
        role="list"
        className={cn(
          // --text-sm, the line's own size: the slot is 1em, and in the
          // block's --text-base it measured 1px wider than the caret.
          'flex flex-col gap-[var(--gap-field)] text-sm',
          shown.length > 0 && 'mt-[var(--gap-field)]',
          slot,
        )}
      >
        {shown.map((call) => (
          <li key={call.id}>
            <Call call={call} indent />
          </li>
        ))}
      </ul>
      <span role="status" className="sr-only">
        {live ? (
          <>
            {current ? null : <>{summary}. </>}
            {failed.map((c) => (
              <span key={c.id}>
                {c.error} {c.next}{' '}
              </span>
            ))}
          </>
        ) : null}
      </span>
    </div>
  );
}

export { Tool, ToolGroup };
