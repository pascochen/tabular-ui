import { AgentBlock, AgentPlan, AgentReasoning, runStatuses, StatusBadge, type RunStatus } from 'tabular-ui';

import { Rail, Section, SectionHeader } from '../components/layout';
import { component, moments } from '../content';
import { duplicatePayment } from '../data';
import { pageMeta } from '../lib/meta';
import type { Route } from './+types/vocabulary';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'Vocabulary · Tabular UI',
    description:
      'The words Tabular UI uses for an agent run: its moments, the three ways it waits for a person, and its status words.',
    path: '/vocabulary',
  });

/**
 * The three components that stop the run for a person (wireframe `79:396`).
 * Definitions and examples signed off by the owner, 2026-10-28.
 */
const waits = [
  {
    name: 'question',
    needs: 'A fact or a choice it can’t work out alone.',
    can: 'Answer, skip, or let the agent decide.',
    example: 'Which entities should the variance cover: all of them, or KJP only?',
  },
  {
    name: 'confirmation',
    needs: 'Permission for one action before it runs.',
    can: 'Let it run once, or stop it.',
    example: 'Send the variance summary to the controller?',
  },
  {
    name: 'agent-block',
    needs: 'Review of a change that would post to the books.',
    can: 'Approve, edit, or reject the exact entry.',
    example: `Reverse the duplicate payment of ${duplicatePayment.amountLabel}`,
  },
];

/** The authorship labels `docs/agent-voice.md` defines: the role, or the role and a state. */
const labels = [
  { label: 'AI', use: 'Content the agent wrote.' },
  { label: 'AI · Awaiting review', use: 'A proposal waiting for a person.' },
  { label: 'AI · Posted', use: 'A proposal a person posted.' },
  { label: 'AI · Not posted', use: 'A proposal a person declined.' },
];

/** Words shipping products use, and the ones Tabular uses instead (wireframe `79:445`). Owner copy. */
const insteadOf = [
  {
    use: <StatusBadge status="needs-review" />,
    instead: 'The agent is waiting for you',
    seen: '“Pending Approval”, “Waiting for your approval”',
  },
  { use: 'Thinking…', instead: 'The agent is thinking', seen: 'Thought for 9s' },
  { use: 'AI · Posted', instead: 'Done!', seen: '“Action Complete”' },
];

const statuses = Object.keys(runStatuses) as RunStatus[];

const cell = 'border-t border-border px-[var(--pad-cell-x)] py-2 text-left align-top';

export default function Vocabulary() {
  return (
    <>
      <Section rule={false}>
        <Rail className="flex flex-col gap-[var(--gap-group)]">
          <h1 className="text-site-display-sm font-semibold text-text-primary md:text-site-display">Vocabulary</h1>
          <p className="max-w-[var(--site-w-prose)] text-site-lead text-text-secondary">
            The words Tabular uses when an agent is working, waiting for you, or done. Each word names one state, so a
            label never means two things.
          </p>
        </Rail>
      </Section>

      <Section labelledBy="vocab-moments">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader id="vocab-moments" title={`${moments.length} moments`} />
          <ol role="list" className="grid grid-cols-1 gap-[var(--site-gap-tight)] md:grid-cols-5">
            {moments.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-[var(--gap-bonded)] border border-border p-[var(--site-gap-tight)]"
              >
                <h3 className="text-site-title-sm font-semibold text-text-primary">{m.title}</h3>
                <p className="text-site-small text-text-body">{m.line}</p>
                <p className="text-xs text-text-secondary">{m.components.map((c) => c.title).join(', ')}</p>
              </li>
            ))}
          </ol>
        </Rail>
      </Section>

      <Section labelledBy="vocab-waits">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="vocab-waits"
            title="Three ways the agent waits for you"
            lead="Three components stop the run for a person. Each needs a sentence that tells it apart from the other two."
          />
          <ul role="list" className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-3">
            {waits.map((w) => (
              <li
                key={w.name}
                className="flex flex-col gap-[var(--gap-group)] border border-border p-[var(--site-gap)]"
              >
                <h3 className="text-site-title font-semibold text-text-primary">{component(w.name).title}</h3>
                {[
                  ['The agent needs', w.needs],
                  ['The person can', w.can],
                  ['Kasane example', w.example],
                ].map(([term, text]) => (
                  <div
                    key={term}
                    className="flex flex-col gap-[var(--gap-bonded)] border-t border-border pt-[var(--gap-group)]"
                  >
                    <p className="text-site-small font-semibold text-text-secondary">{term}</p>
                    <p className="text-site-body text-text-body">{text}</p>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Rail>
      </Section>

      <Section labelledBy="vocab-words">
        <Rail className="flex flex-col gap-[var(--site-gap)]">
          <SectionHeader
            id="vocab-words"
            title="Status words"
            lead="Status copy names the state. A role tag may say who, as AI; the agent is never a sentence’s subject. The words come from the components that show them."
          />

          <div className="grid grid-cols-1 gap-[var(--site-gap)] md:grid-cols-3">
            <div className="flex flex-col gap-[var(--gap-group)]">
              <h3 className="text-site-title-sm font-semibold text-text-primary">Statuses</h3>
              <p className="text-site-small text-text-secondary">The state of a run or an item, from StatusBadge.</p>
              <ul role="list" className="flex flex-col gap-[var(--gap-inline)]">
                {statuses.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-[var(--gap-inline)]">
                    <StatusBadge status={s} />
                    <span className="text-xs text-text-secondary">{runStatuses[s].tone}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-[var(--gap-group)]">
              <h3 className="text-site-title-sm font-semibold text-text-primary">Activity lines</h3>
              <p className="text-site-small text-text-secondary">
                What is happening now: a present participle, no subject, ending in an ellipsis.
              </p>
              <AgentBlock authorship="AI">
                <div className="flex flex-col gap-[var(--gap-group)]">
                  <AgentReasoning status="streaming" text="" />
                  <AgentPlan title="Explain the H1 gap" description="" status="streaming" steps={[]} />
                </div>
              </AgentBlock>
            </div>

            <div className="flex flex-col gap-[var(--gap-group)]">
              <h3 className="text-site-title-sm font-semibold text-text-primary">Authorship labels</h3>
              <p className="text-site-small text-text-secondary">
                Who wrote it, and its state: the role, or the role and a state.
              </p>
              <ul role="list" className="flex flex-col gap-[var(--gap-inline)]">
                {labels.map((l) => (
                  <li key={l.label}>
                    <AgentBlock authorship={l.label}>
                      <p className="text-text-secondary">{l.use}</p>
                    </AgentBlock>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <table className="w-full border-collapse border border-border text-site-small">
            <caption className="pb-[var(--gap-inline)] text-left text-site-small text-text-secondary">
              The words Tabular uses, and the ones it doesn’t.
            </caption>
            <thead>
              <tr>
                <th scope="col" className={`${cell} font-semibold text-text-primary`}>
                  Use
                </th>
                <th scope="col" className={`${cell} font-semibold text-text-primary`}>
                  Instead of
                </th>
                <th scope="col" className={`${cell} font-semibold text-text-primary`}>
                  Seen in shipping products
                </th>
              </tr>
            </thead>
            <tbody>
              {insteadOf.map((row, i) => (
                <tr key={i}>
                  <td className={`${cell} font-semibold text-text-primary`}>{row.use}</td>
                  <td className={`${cell} text-text-body`}>{row.instead}</td>
                  <td className={`${cell} text-text-secondary`}>{row.seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Rail>
      </Section>
    </>
  );
}
