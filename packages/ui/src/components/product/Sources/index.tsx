import { useId } from 'react';

import { cn } from '../../../lib/utils';
import { AttachmentRow } from '../AttachmentRow';

/** One thing an answer rests on. `InlineCitation` takes the same object. */
export type Source = {
  /** Stable key. Ties a citation to its row. */
  id: string;
  /** File name or identifier. Mono, truncated, as `AttachmentRow` draws it. */
  name: string;
  /** Pre-formatted, e.g. "18 KB". */
  size?: string;
  /** Makes the name a link. */
  href?: string;
  /** Swap the `<a>` for a router link: `render={<Link to="/f/1" />}`. */
  render?: React.ReactElement<{ className?: string }>;
};

export type SourcesProps = {
  /** What the answer rests on, in citation order: the first is 1. */
  sources: readonly Source[];
  /**
   * What wasn't checked, one sentence each, naming the part and why: "KUS's
   * bank statements: the pack holds KJP's September export only." **Required.**
   * Pass `[]` only when every part of the question was checked, and the
   * component says so. A node, so file names can be mono (§8.3).
   */
  notChecked: readonly React.ReactNode[];
  className?: string;
};

/**
 * Sources — product. Composes `AttachmentRow`.
 *
 * Lists what an answer rests on, and what wasn't checked. agent-voice.md's
 * principle 4, "Say what was not checked", is enforced here rather than left to
 * the caller: `notChecked` is required, so an answer can't list its sources
 * without saying where they stop. An empty list is a claim too, and the
 * component writes it out instead of drawing nothing.
 *
 * Numbered from 1 in the order given, so `InlineCitation` marks in the answer
 * point at a row by the same figure.
 *
 * Agent-authored sources render inside the turn's `AgentBlock`, like
 * `AgentReasoning` and `AgentPlan`, and draw no rail of their own.
 */
function Sources({ sources, notChecked, className }: SourcesProps) {
  const id = useId();
  const sourcesLabel = `${id}-sources`;
  const notCheckedLabel = `${id}-not-checked`;

  return (
    <div data-slot="sources" className={cn('flex flex-col gap-[var(--gap-group)] text-sm', className)}>
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <p id={sourcesLabel} className={labelClassName}>
          Sources
        </p>
        <ol aria-labelledby={sourcesLabel} className="flex flex-col">
          {sources.map((source, i) => (
            // The row's hover moves to the item, so the number is inside it.
            <li key={source.id} data-slot="source" className="flex items-center hover:bg-bg-hover">
              <span className="w-[2ch] shrink-0 pl-[var(--pad-cell-x)] text-right text-xs tabular-nums text-text-secondary box-content">
                {i + 1}
              </span>
              <AttachmentRow
                name={source.name}
                size={source.size}
                href={source.href}
                render={source.render}
                className="min-w-0 flex-1 hover:bg-transparent"
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <p id={notCheckedLabel} className={labelClassName}>
          Not checked
        </p>
        {notChecked.length > 0 ? (
          <ul aria-labelledby={notCheckedLabel} className="flex flex-col">
            {notChecked.map((line, i) => (
              // A fixed list for one answer, never reordered: the index is its identity.
              <li key={i} className={lineClassName}>
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className={lineClassName}>Nothing. Every part of the question was checked.</p>
        )}
      </div>
    </div>
  );
}

// A part's name inside agent output, as a proposal's "Proposed journal entry".
const labelClassName = 'px-[var(--pad-cell-x)] text-xs font-medium text-text-secondary';

// A one-line sentence is 28px, an `AttachmentRow`'s height, so both lists keep
// one rhythm. A longer one wraps and grows.
const lineClassName = 'px-[var(--pad-cell-x)] py-[var(--pad-cell-y)] text-text-body';

export { Sources };
