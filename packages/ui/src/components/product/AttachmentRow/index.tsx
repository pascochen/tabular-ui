import { cloneElement, isValidElement, useState } from 'react';
// From Phosphor's types file, not the package root: Storybook's react-docgen
// follows a type import into the package, and the root re-exports ~1,500
// icons. That cost 2.1s of blocked dev server per cold load wherever this
// component is in the graph (found 2026-10-15). Same type, erased at build.
import type { Icon } from '@phosphor-icons/react/dist/lib/types';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { ProgressBar } from '../ProgressBar';
import { StatusBadge } from '../StatusBadge';
import { runStatusRowTreatment, type RunStatus } from '../StatusBadge/statuses';
import { TruncatedText } from '../TruncatedText';
import { fallbackFileIcon, fileExtension, fileTypeIcons } from './fileTypes';

export type AttachmentRowProps = {
  /**
   * File name. Rendered mono as an identifier (§8.3). Cut off, it shows whole
   * in a tooltip on hover and keyboard focus; on touch, a name that isn't a
   * link opens the row in place to it, and a link opens the file.
   */
  name: string;
  /** Pre-formatted, e.g. "2.4 MB". The row does not format bytes. */
  size?: string;
  /** Pre-formatted. The row does not format time. */
  timestamp?: string;
  /** Who attached it — the audit trail for evidence pinned to a record. */
  attachedBy?: string;
  /** Upload or validation state, from §5's vocabulary. There is no parallel set. */
  status?: RunStatus;
  /** 0–100. Replaces size and timestamp with a track while work is in flight. */
  progress?: number;
  /**
   * Makes the filename a link. Omit for a row that only displays. Where it
   * leads must show the name whole: on touch, that is how a cut name is read.
   */
  href?: string;
  /** Swap the `<a>` for a router link: `render={<Link to="/f/1" />}`. */
  render?: React.ReactElement<{ className?: string }>;
  /** Trailing controls — `IconButton`s. Kept out of the filename's hit area. */
  actions?: React.ReactNode;
  /** Overrides the glyph inferred from the extension. */
  icon?: Icon;
  className?: string;
};

/**
 * AttachmentRow — product.
 *
 * One file, identified, with state. Serves all three attachment contexts —
 * evidence pinned to a record, a source file feeding a pipeline run, and a file
 * shared in an agent conversation — because that triple is the whole overlap
 * between them. An agent-authored attachment renders *inside* `AgentBlock`;
 * there is no separate agent variant, because the authorship signal belongs to
 * `AgentBlock` and nothing else may imitate it.
 *
 * 28px via `--h-row-sm`, so a list of these sits flush against `DataTable`.
 *
 * **The filename is the link. The row is not wholly clickable**, and that is a
 * decision rather than an omission. shadcn's `Attachment` stretches an
 * invisible `absolute inset-0` trigger across the card so the whole thing is
 * clickable while its action buttons sit above it at a higher z-index — a real
 * technique for a real problem, since a `<button>` cannot live inside an `<a>`.
 * It is wrong here for four reasons:
 *
 * 1. An `inset-0` overlay eats the pointer, so the filename cannot be selected
 *    and copied. Copying an identifier is routine in this product.
 * 2. There is no single row action to bind: evidence wants preview, a pipeline
 *    source wants its parse errors, an agent file wants download.
 * 3. A stretched trigger has no visible text, so it needs an `aria-label`
 *    duplicating the filename — two accessible names for one target.
 * 4. `DataTable` already owns whole-row activation via `onRowClick`. A second,
 *    overlay-based mechanism would fork the convention.
 *
 * If a *card* form ever needs whole-card activation, that is when the stretched
 * trigger earns its place — not here.
 *
 * **A cut name can be read.** It shows whole in a tooltip on hover and on
 * keyboard focus (`TruncatedText`). A tooltip never opens on touch, so a cut
 * name that isn't a link becomes a disclosure: the row opens in place to the
 * full name, as `RunLogRow`'s does, and stays 28px. A linked name opens its
 * file, which shows the name.
 *
 * **Status reuses `runStatuses`.** Upload state maps onto §5's vocabulary
 * without a new term: queued → running → passed / failed, with `needs-review`
 * for a parsed file awaiting sign-off. Reaching for a sixth hue to mean
 * "uploading" breaks §0 rule 2 when `running` already means exactly that.
 */
function AttachmentRow({
  name,
  size,
  timestamp,
  attachedBy,
  status,
  progress,
  href,
  render,
  actions,
  icon,
  className,
}: AttachmentRowProps) {
  const FileGlyph = icon ?? fileTypeIcons[fileExtension(name)] ?? fallbackFileIcon;
  const inFlight = progress !== undefined;
  const linked = isValidElement(render) || Boolean(href);
  // Measured by TruncatedText, after layout and on every resize.
  const [nameCut, setNameCut] = useState(false);
  const [open, setOpen] = useState(false);
  // A name that isn't a link opens the row to itself once it's cut. An open
  // row stays a control until it is closed, so a resize that lets the name
  // fit can't strand it open.
  const expandable = !linked && (nameCut || open);

  // §8.3 — identifiers render mono, one step below the adjacent sans, because
  // mono runs visually larger at equal px.
  const nameClassName = cn(
    'block min-w-0 font-mono text-xs',
    // A row in a list of links: ink, and the underline waits for hover and
    // focus. The list's shape says each row opens (§1, the list exception).
    linked
      ? 'text-text-interactive decoration-1 underline-offset-2 hover:underline focus-visible:underline'
      : 'text-text-body',
    'rounded-xs outline-none focus-visible:outline-ring',
    'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
    // Inset: a list of these scrolls, and an offset ring would be clipped (§4).
    'focus-visible:outline-offset-[-2px]',
  );

  // The name's own text: cut, it shows whole in a tooltip on hover, and on
  // keyboard focus of the link or the disclosure it sits in.
  const nameText = (
    <TruncatedText
      showOnControlFocus
      onTruncatedChange={setNameCut}
      className={expandable ? 'inline-block max-w-full align-top' : 'block'}
    >
      {name}
    </TruncatedText>
  );

  const label = (
    <span className="min-w-0 flex-1">
      {isValidElement(render) ? (
        cloneElement(render, { className: cn(nameClassName, render.props.className) }, nameText)
      ) : href ? (
        <a href={href} className={nameClassName}>
          {nameText}
        </a>
      ) : expandable ? (
        // The name is the disclosure, so it is a real control: `Button
        // variant="inline"`, as RunLogRow's row is. Inline-block, the button
        // and its text both: a block inside the button wrote a blank line
        // before the row in a copy (identifier-copy.spec.ts).
        <Button
          variant="inline"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(nameClassName, 'inline-block max-w-full cursor-pointer text-left align-top')}
        >
          {nameText}
        </Button>
      ) : (
        <TruncatedText onTruncatedChange={setNameCut} className={nameClassName}>
          {name}
        </TruncatedText>
      )}
    </span>
  );

  return (
    <div
      data-slot="attachment-row"
      data-status={status}
      className={cn(
        // The padding is the row's, so §5's agent rail can take its 2px off
        // it, and the open name below shares the inset.
        'px-[var(--pad-cell-x)] text-sm hover:bg-bg-hover',
        // §5 owns what a failed row looks like; this component does not decide.
        status ? runStatusRowTreatment[status] : undefined,
        className,
      )}
    >
      <div className="flex h-[var(--h-row-sm)] items-center gap-[var(--pad-cell-x)]">
        <FileGlyph
          weight="bold"
          aria-hidden="true"
          className="size-[var(--size-icon-md)] shrink-0 text-text-secondary"
        />

        {label}

        {inFlight ? (
          <div className="w-24 shrink-0">
            <ProgressBar value={progress} label={`Uploading ${name}`} size="sm" />
          </div>
        ) : (
          <>
            {attachedBy ? <span className="shrink-0 truncate text-xs text-text-secondary">{attachedBy}</span> : null}
            {size ? <span className="shrink-0 text-xs tabular-nums text-text-secondary">{size}</span> : null}
            {timestamp ? <span className="shrink-0 text-xs tabular-nums text-text-secondary">{timestamp}</span> : null}
          </>
        )}

        {status ? <StatusBadge status={status} /> : null}

        {actions ? <div className="flex shrink-0 items-center gap-[var(--gap-chip)]">{actions}</div> : null}
      </div>

      {expandable && open ? (
        // The name whole, under itself: past the glyph and its gap, wrapping
        // anywhere, since a file name may have no spaces to break at.
        <p
          data-slot="attachment-row-name"
          className={cn(
            'pb-[var(--pad-cell-y)] pl-[calc(var(--size-icon-md)+var(--pad-cell-x))]',
            'font-mono text-xs text-text-body [overflow-wrap:anywhere]',
          )}
        >
          {name}
        </p>
      ) : null}
    </div>
  );
}

export { AttachmentRow };
