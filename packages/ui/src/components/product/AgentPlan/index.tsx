import { useId } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { Spinner } from '../../foundational/Spinner';
import { WorkingLabel } from '../workingLabel';

export type AgentPlanStep = {
  /** Stable across renders while the plan streams. */
  id: string;
  /** A node, so model and column names can be set in `--font-mono` (§8.3). */
  label: React.ReactNode;
};

export type AgentPlanStatus = 'streaming' | 'ready';

export type AgentPlanProps = {
  title: string;
  /** One sentence on what the plan does. A node, so identifiers can be set in `--font-mono`. */
  description: React.ReactNode;
  /** In order. While streaming, the steps that have arrived so far. */
  steps: AgentPlanStep[];
  /**
   * `streaming` while steps are still arriving: a "Drafting step N" row
   * follows the last step and both actions are disabled. `ready` once the
   * plan is complete.
   */
  status: AgentPlanStatus;
  /**
   * While streaming: when drafting of the step in progress began, epoch ms.
   * "Drafting step N…" gains an elapsed figure after 3s (§11.5), counted
   * from here; without it, from when that step's row appeared.
   */
  startedAt?: number;
  onRun?: () => void;
  onEdit?: () => void;
  /**
   * `false` leaves out Run plan and Edit, for a plan the agent can't carry
   * out: today it changes nothing (`docs/agent-voice.md`, *Fixed strings*).
   */
  showActions?: boolean;
  className?: string;
};

/**
 * AgentPlan — product. A plan the agent proposes: a title, one sentence, the
 * numbered steps, then Run plan and Edit.
 *
 * **A part of an `AgentBlock`, not a block of its own** — see
 * `AgentReasoning`. The block around it carries the rail and the
 * authorship label. It is never a `Card` (CLAUDE.md).
 *
 * While streaming, the section is `aria-busy`, so a screen reader can wait
 * for the finished plan rather than hear it step by step.
 */
function AgentPlan({
  title,
  description,
  steps,
  status,
  startedAt,
  onRun,
  onEdit,
  showActions = true,
  className,
}: AgentPlanProps) {
  const titleId = useId();
  const streaming = status === 'streaming';

  return (
    <section
      data-slot="agent-plan"
      data-status={status}
      aria-labelledby={titleId}
      aria-busy={streaming || undefined}
      className={cn('flex flex-col gap-[var(--gap-group)]', className)}
    >
      {/* Title and its sentence are one unit: --gap-bonded (§7.4). */}
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <h3 id={titleId} className="text-md font-semibold text-text-primary">
          {title}
        </h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>

      <div className="flex flex-col gap-[var(--gap-field)]">
        {/*
          The visible numbers are aria-hidden spans, so role="list" is
          explicit: Safari drops list semantics from a list without markers,
          and "item 2 of 4" is what a screen reader should hear.
        */}
        <ol role="list" className="flex flex-col gap-[var(--gap-field)]">
          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-[var(--gap-inline)] text-base text-text-body">
              {/* w-4 (16px), primitive: no token for a list-number column. */}
              <span aria-hidden="true" className="w-4 shrink-0 text-right tabular-nums text-text-secondary">
                {index + 1}
              </span>
              <span className="min-w-0">{step.label}</span>
            </li>
          ))}
        </ol>
        {streaming ? (
          <div className="flex items-center gap-[var(--gap-inline)] text-base text-text-secondary">
            {/* Centred in the number column. Same colour as its label (§11.1). */}
            <span className="flex w-4 shrink-0 justify-end">
              <Spinner className="size-[var(--size-icon-xs)]" />
            </span>
            {/* Keyed to the step, so each step's figure starts again. */}
            <WorkingLabel key={steps.length} label={`Drafting step ${steps.length + 1}`} startedAt={startedAt} />
          </div>
        ) : null}
      </div>

      {showActions ? (
        <div className="flex justify-end gap-[var(--gap-inline)]">
          <Button size="sm" variant="ghost" disabled={streaming} onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" disabled={streaming} onClick={onRun}>
            Run plan
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export { AgentPlan };
