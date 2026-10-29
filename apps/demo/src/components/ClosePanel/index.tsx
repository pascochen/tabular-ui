import type { ReactNode } from 'react';
import { AppShellPanelBody, MetricTile, ProgressBar, StatusBadge, buttonVariants, cn } from 'tabular-ui';

import { checkLabel, isTiedOut, progress, type CloseState } from '../../lib/close-state';
import { useClose } from '../../lib/close-context';
import { checks, close, lastClosedMonth } from '../../lib/kasane';

/** §8.1's micro-label tier, as AppShell's sidebar section labels. A heading, so the panel has an outline. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[var(--gap-field)]">
      <h3 className="text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary">{title}</h3>
      {children}
    </section>
  );
}

/**
 * What the figure means now. A check that reran to its after-figure is tied
 * out. The cut-off settled by keeping September locked changes no figure,
 * so it says where the amount went instead. Words, so the state survives
 * without colour: the figure itself takes no hue (§5).
 */
function caption(state: CloseState, c: (typeof checks)[number]) {
  if (isTiedOut(state, c.id)) return `Tied out. ${c.meaning}.`;
  const round = state.hero.rounds[state.hero.rounds.length - 1];
  if (c.id === close.hero.exception && round.answer === 'keep-locked' && round.stage === 'done') {
    return `Listed for the auditors' review. ${c.meaning}.`;
  }
  return `${c.meaning}.`;
}

/**
 * The right panel of #sep-close: the record. How far the close is, each
 * check's figure, each exception's status and the decisions so far. It stores
 * nothing: every line is derived from the close state.
 */
export function ClosePanel() {
  const { state } = useClose();
  const { resolved, total } = progress(state);

  return (
    <AppShellPanelBody className="flex flex-col gap-[var(--gap-section)]">
      <div className="flex flex-col gap-[var(--gap-field)]">
        <p className="text-sm text-text-body">
          <span className="tabular-nums">
            {resolved} of {total}
          </span>{' '}
          exceptions resolved
        </p>
        {/* info: the close is work in progress (ProgressBar README). */}
        <ProgressBar value={(resolved / total) * 100} label={`${lastClosedMonth} close exceptions resolved`} />
      </div>

      <Section title="Checks">
        <div className="grid grid-cols-2 gap-[var(--gap-group)]">
          {checks.map((c) => (
            <MetricTile
              key={c.id}
              size="sm"
              label={c.label}
              value={checkLabel(state, c.id)}
              caption={caption(state, c)}
            />
          ))}
        </div>
      </Section>

      <Section title="Exceptions">
        <ul role="list" className="-mx-[var(--pad-control-x)] flex flex-col">
          {close.exceptions.map((e) => {
            const done = state.exceptions[e.id].status === 'resolved';
            return (
              <li key={e.id}>
                {/* A link to the exception's message in the channel. */}
                <a
                  href={`#${e.id}`}
                  className={cn(
                    buttonVariants({ variant: 'ghost' }),
                    'w-full justify-between font-normal text-text-body',
                  )}
                >
                  <span className="min-w-0 truncate">{e.title}</span>
                  {done ? (
                    <StatusBadge status="passed">Resolved</StatusBadge>
                  ) : (
                    <StatusBadge status="needs-review">Open</StatusBadge>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Decisions">
        {state.log.length ? (
          <ol role="list" className="flex flex-col gap-[var(--gap-field)]">
            {state.log.map((entry) => (
              <li
                key={`${entry.exception}-${entry.at}`}
                className="flex gap-[var(--gap-inline)] text-sm text-text-body"
              >
                <time
                  dateTime={`${close.scene.date}T${entry.at}`}
                  className="shrink-0 text-xs leading-[var(--text-sm--line-height)] text-text-secondary tabular-nums"
                >
                  {entry.at}
                </time>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-text-secondary">No decisions yet.</p>
        )}
      </Section>
    </AppShellPanelBody>
  );
}
