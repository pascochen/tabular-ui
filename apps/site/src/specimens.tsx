import { useEffect, useRef, useState } from 'react';
import {
  AgentBlock,
  AgentPlan,
  AgentReasoning,
  AttachmentRow,
  Button,
  ChatComposer,
  ChatStarter,
  ChatThread,
  Field,
  Input,
  LineageTree,
  RunLogRow,
  runStatuses,
  StatusBadge,
  type RunStatus,
} from 'tabular-ui';

import { duplicatePayment, h1Gap, kasane, packFile } from './data';
import { exactMoney, formatBytes, money } from './lib/format';
import { useAnnouncer, usePlayback } from './lib/playback';
import { LiveRegion, ReplayButton, Specimen } from './playback';

/**
 * The specimens (docs/site.md §6). Each renders the real library components with
 * Kasane data from src/data.ts, as a list of frames the player steps through
 * (src/playback.tsx). The last frame is the rest frame, the one the prerendered
 * HTML shows.
 */

/** The question the hero and the chat specimens answer (D5). Draft copy. */
const question = 'Did we pay any supplier twice this half?';

const noop = () => {};

// ---------------------------------------------------------------------------
// The proposal: the hero (D5, D6) and the Agent block card
// ---------------------------------------------------------------------------

type Outcome = 'waiting' | 'editing' | 'posted' | 'declined';
type FocusTarget = 'post' | 'edit' | 'period' | 'replay' | null;

/**
 * The agent's proposal, live. It stops and waits; the visitor is the person it
 * waits for (D6).
 * - **Post entry** sets the label to "AI · Posted" and meta to "posted by you",
 *   and writes a passed run log row with the entry's journal number (D1, D2).
 * - **Don't post** sets "AI · Not posted", "declined by you", and a skipped row:
 *   nothing reached the books.
 * - **Edit entry** turns the period and memo into fields; Done returns to the
 *   proposal with the change, still waiting. The amount stays read-only: it is
 *   the duplicate's, from data.
 * - **Replay** then plays the run from the question back to the waiting proposal.
 *
 * Each outcome is announced once, and focus moves to the control that replaces
 * the one pressed, so it is never dropped on the page.
 *
 * In the hero the question is a plain line, not a ChatThread user turn:
 * ChatThread's assistant turn takes no actions, and the proposal can't be a
 * second block inside it. A library gap, raised in PR 2.
 */
function Proposal({ hero = false }: { hero?: boolean }) {
  const d = duplicatePayment;
  const [first, second] = d.entries;
  const defaults = { period: kasane.company.openPeriod, memo: `Reverse duplicate invoice ${d.reverse}` };

  // Four frames: the question, the answer, its sources, the entry. The hero rests and never autoplays (D6).
  const { ref, frame, playing, play } = usePlayback({ frames: 4, autoplay: !hero });
  const { announce, message } = useAnnouncer();
  const [outcome, setOutcome] = useState<Outcome>('waiting');
  const [entry, setEntry] = useState(defaults);
  const [draft, setDraft] = useState(defaults);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);

  const postRef = useRef<HTMLButtonElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const periodRef = useRef<HTMLInputElement>(null);
  const replayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTarget === 'post') postRef.current?.focus();
    if (focusTarget === 'edit') editRef.current?.focus();
    if (focusTarget === 'period') periodRef.current?.focus();
    if (focusTarget === 'replay') replayRef.current?.querySelector('button')?.focus();
  }, [focusTarget, outcome]);

  const decide = (next: 'posted' | 'declined') => {
    setOutcome(next);
    setFocusTarget('replay');
    announce(next === 'posted' ? `Posted as ${d.nextJournalId}.` : 'Not posted.');
  };

  const replay = () => {
    setOutcome('waiting');
    setEntry(defaults);
    setDraft(defaults);
    setFocusTarget(null);
    play(() => {
      setFocusTarget('post');
      announce('Awaiting review.');
    });
  };

  const decided = outcome === 'posted' || outcome === 'declined';
  const authorship =
    outcome === 'posted' ? 'AI · Posted' : outcome === 'declined' ? 'AI · Not posted' : 'AI · Awaiting review';
  const meta = outcome === 'posted' ? 'posted by you' : outcome === 'declined' ? 'declined by you' : undefined;

  return (
    <div ref={ref} className="flex flex-1 flex-col gap-[var(--gap-group)]">
      <div aria-busy={playing || undefined} className="flex flex-1 flex-col gap-[var(--gap-group)]">
        {hero ? (
          <p className="text-text-secondary">
            <span className="font-medium text-text-body">Question:</span> {question}
          </p>
        ) : null}
        {frame >= 1 || !hero ? (
          <AgentBlock authorship={authorship} meta={meta}>
            <div className="flex flex-col gap-[var(--gap-group)]">
              <p>
                Yes. {d.entity} entered supplier invoice <code>{d.supplierInvoice}</code> twice, as <code>{first}</code>{' '}
                and <code>{second}</code>, {d.amountLabel} each, and {d.paid.every(Boolean) ? 'paid both' : 'paid one'}.
              </p>
              {frame >= 2 ? (
                <p className="text-text-secondary">
                  From <code>{packFile(d.sources[0])}</code> and <code>{packFile(d.sources[1])}</code>. I can reverse{' '}
                  <code>{d.reverse}</code>, so the supplier owes the amount back.
                </p>
              ) : null}
              {frame >= 3 ? (
                <div className="flex flex-col gap-[var(--gap-bonded)] border border-border p-[var(--pad-card)]">
                  <p className="text-xs font-medium text-text-secondary">
                    {outcome === 'posted' ? 'Journal entry' : 'Proposed journal entry'}
                  </p>
                  {outcome === 'editing' ? (
                    <div className="flex flex-col gap-[var(--gap-field)] pt-1">
                      <Field label="Memo">
                        {(p) => (
                          <Input
                            {...p}
                            value={draft.memo}
                            onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                          />
                        )}
                      </Field>
                      <Field label="Period">
                        {(p) => (
                          <Input
                            {...p}
                            ref={periodRef}
                            content="mono"
                            value={draft.period}
                            onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                          />
                        )}
                      </Field>
                      <p className="text-text-secondary">
                        {d.entity}, {d.amountLabel}. The amount is the duplicate’s, and can’t be changed here.
                      </p>
                      <div className="flex flex-wrap gap-[var(--gap-inline)]">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEntry(draft);
                            setOutcome('waiting');
                            setFocusTarget('edit');
                          }}
                        >
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDraft(entry);
                            setOutcome('waiting');
                            setFocusTarget('edit');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-text-primary">{entry.memo}</p>
                      <p className="text-text-secondary">
                        {d.entity}, {d.amountLabel}, period {entry.period}
                        {outcome === 'posted' ? (
                          <>
                            , <code>{d.nextJournalId}</code>
                          </>
                        ) : null}
                      </p>
                    </>
                  )}
                  {outcome === 'waiting' ? (
                    <div className="mt-2 flex flex-wrap gap-[var(--gap-inline)]">
                      <Button size="sm" ref={postRef} onClick={() => decide('posted')}>
                        Post entry
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        ref={editRef}
                        onClick={() => {
                          setDraft(entry);
                          setOutcome('editing');
                          setFocusTarget('period');
                        }}
                      >
                        Edit entry
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide('declined')}>
                        Don’t post
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </AgentBlock>
        ) : null}
        {/* The run log row's slot (D6): dashed while it waits, filled once a person decides. */}
        {outcome === 'posted' ? (
          <RunLogRow status="passed" name={d.nextJournalId} />
        ) : outcome === 'declined' ? (
          <RunLogRow status="skipped" name={d.reverse} />
        ) : frame >= 3 ? (
          <p className="border border-dashed border-border-strong px-[var(--pad-card)] py-2 text-sm text-text-secondary">
            Run log row is written here after Post.
          </p>
        ) : null}
      </div>
      {decided ? (
        <div ref={replayRef} className="flex justify-end">
          <ReplayButton title={hero ? 'the hero’s run' : 'Agent block'} onClick={replay} />
        </div>
      ) : null}
      <LiveRegion message={message} />
    </div>
  );
}

export function HeroSpecimen() {
  return <Proposal hero />;
}

export function AgentBlockSpecimen() {
  return <Proposal />;
}

// ---------------------------------------------------------------------------
// The other nine cards
// ---------------------------------------------------------------------------

const reasoningText = `Read ${packFile('trial_balance_monthly.csv')} and ${packFile('budget_forecast_monthly.csv')}. Translated each entity at budget rates, then compared H1 with budget.`;

/** Agent reasoning: thinking, then folded, with the answer it led to (D5, the H1 gap). */
export function ReasoningSpecimen() {
  return (
    <Specimen title="Agent reasoning" frames={2}>
      {(f) => (
        <AgentBlock authorship="AI">
          <div className="flex flex-col gap-[var(--gap-group)]">
            <AgentReasoning status={f === 0 ? 'streaming' : 'done'} text={reasoningText} />
            {f === 1 ? (
              <p>
                H1 operating profit is {money(h1Gap.shortfall)} under budget. Exchange rates explain{' '}
                {money(h1Gap.exchangeRates)} of it.
              </p>
            ) : null}
          </div>
        </AgentBlock>
      )}
    </Specimen>
  );
}

const planSteps = [
  {
    id: 'read',
    label: (
      <>
        Read <code>{packFile('trial_balance_monthly.csv')}</code> for H1
      </>
    ),
  },
  { id: 'translate', label: 'Translate each entity at budget rates' },
  {
    id: 'compare',
    label: (
      <>
        Compare with <code>{packFile('budget_forecast_monthly.csv')}</code>
      </>
    ),
  },
  { id: 'trace', label: 'Trace what remains to its accounts' },
];

/** Agent plan: drafted step by step where you can see it, then ready to run. */
export function PlanSpecimen() {
  const last = planSteps.length;
  return (
    <Specimen title="Agent plan" frames={last + 1}>
      {(f) => (
        <AgentBlock authorship="AI">
          <AgentPlan
            title="Explain the H1 gap"
            description={`Split the ${money(h1Gap.shortfall)} between exchange rates and performance, and trace each part to its entries.`}
            status={f === last ? 'ready' : 'streaming'}
            steps={planSteps.slice(0, f === last ? last : f)}
          />
        </AgentBlock>
      )}
    </Specimen>
  );
}

const suggestions = ['Explain the H1 operating profit gap', question, 'Which customers pay later each month?'];

/** Chat starter: suggestions written as a person would ask them. A pick fills the box and never sends. Draft copy. */
export function ChatStarterSpecimen() {
  return (
    <Specimen title="Chat starter" frames={suggestions.length + 1}>
      {(f) => (
        <ChatStarter
          description={`Ask about ${kasane.company.name}’s books, from the files it shared.`}
          suggestions={suggestions.slice(0, f)}
          onSelect={noop}
        />
      )}
    </Specimen>
  );
}

/** Chat composer: a file queued, then uploading, holds Send. */
export function ComposerSpecimen() {
  const file = kasane.pack.find((f) => f.name === packFile('trial_balance_monthly.csv'));
  const statuses: (RunStatus | null)[] = [null, 'queued', 'running'];
  return (
    <Specimen title="Chat composer" frames={statuses.length}>
      {(f) => {
        const status = statuses[f];
        return (
          <ChatComposer
            placeholder={`Ask about ${kasane.company.name}’s books…`}
            onSend={noop}
            onAttach={noop}
            attachments={
              file && status ? [{ id: file.name, name: file.name, size: formatBytes(file.bytes), status }] : []
            }
          />
        );
      }}
    </Specimen>
  );
}

/**
 * Lineage tree: H1 operating profit, then opened down to its bridge, in exact yen,
 * so the parts add up to the total (D5). tests/tokens.spec.ts checks they do.
 * The tree remounts to open: it takes its expansion only on mount.
 */
export function LineageSpecimen() {
  const bridge = kasane.operatingBridge;
  const nodes = [
    {
      id: 'actual',
      name: 'H1 operating profit',
      meta: exactMoney(bridge.actual),
      children: [
        { id: 'budget', name: 'Budget', meta: exactMoney(bridge.budget) },
        ...bridge.steps.map((step) => ({ id: step.id, name: step.label, meta: exactMoney(step.value) })),
      ],
    },
  ];
  return (
    <Specimen title="Lineage tree" frames={2}>
      {(f) => <LineageTree key={f} defaultExpanded={f === 1 ? ['actual'] : []} nodes={nodes} />}
    </Specimen>
  );
}

const attachmentFiles = ['trial_balance_monthly.csv', 'budget_forecast_monthly.csv', 'forecast_memo_fy2026_6+6.md'];

/** Attachment row: the files the answer rests on, read one after another. */
export function AttachmentSpecimen() {
  const files = attachmentFiles.map((name) => kasane.pack.find((f) => f.name === packFile(name))!);
  return (
    <Specimen title="Attachment row" frames={files.length + 1}>
      {(f) => (
        <div className="flex flex-col">
          {files.map((file, i) => (
            <AttachmentRow
              key={file.name}
              name={file.name}
              size={formatBytes(file.bytes)}
              status={i < f ? 'passed' : i === f ? 'running' : 'queued'}
            />
          ))}
        </div>
      )}
    </Specimen>
  );
}

/**
 * Chat thread: the question asked, "Working…", and the answer grown in the same
 * place. Its scroller needs a bounded parent; the aspect ratio bounds it without
 * a height.
 */
export function ThreadSpecimen() {
  const answer = `Yes. ${duplicatePayment.entity} paid supplier invoice ${duplicatePayment.supplierInvoice} twice, ${duplicatePayment.amountLabel} each.`;
  return (
    <Specimen title="Chat thread" frames={2}>
      {(f) => (
        <div className="flex aspect-video flex-col">
          <ChatThread
            turns={[
              { id: 'q', role: 'user', text: question },
              { id: 'a', role: 'assistant', text: f === 1 ? answer : undefined },
            ]}
          />
        </div>
      )}
    </Specimen>
  );
}

const runFiles = ['trial_balance_monthly.csv', 'supplier_invoices_fy2026_h1.csv', 'bank_export_kjp_2026-09.csv'];

/**
 * Run log row: the files read one by one, the last failing and opening to its
 * error. The failure is real: the bank export has no header row (findings.json,
 * bank-header). No times or durations: the data has none.
 */
export function RunLogSpecimen() {
  const names = runFiles.map(packFile);
  return (
    <Specimen title="Run log row" frames={names.length + 1}>
      {(f) => (
        <div className="flex flex-col">
          {names.slice(0, Math.min(f + 1, names.length)).map((name, i) => {
            const last = i === names.length - 1;
            const status: RunStatus = i < f ? (last ? 'failed' : 'passed') : 'running';
            return status === 'failed' ? (
              <RunLogRow
                key={`${name}-failed`}
                status="failed"
                name={name}
                defaultOpen
                detail="No header row, so its six columns can’t be matched to fields. Skipped; the other files were read."
              />
            ) : (
              <RunLogRow key={name} status={status} name={name} />
            );
          })}
        </div>
      )}
    </Specimen>
  );
}

const allStatuses = Object.keys(runStatuses) as RunStatus[];

/** Status badge: every status the library ships, from runStatuses. */
export function StatusSpecimen() {
  return (
    <Specimen title="Status badge" frames={allStatuses.length}>
      {(f) => (
        <ul role="list" className="flex flex-wrap gap-[var(--gap-inline)]">
          {allStatuses.slice(0, f + 1).map((status) => (
            <li key={status}>
              <StatusBadge status={status} />
            </li>
          ))}
        </ul>
      )}
    </Specimen>
  );
}
