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
  InlineCitation,
  Input,
  LineageTree,
  RunLogRow,
  runStatuses,
  Sources,
  StatusBadge,
  type RunStatus,
  type Source,
} from 'tabular-ui';

import { duplicatePayment, h1Gap, kasane, packFile } from './data';
import { exactMoney, formatBytes, money } from './lib/format';
import { useAnnouncer, usePlayback } from './lib/playback';
import { Pair } from './components/specimen';
import { LiveRegion, ReplayButton, Specimen } from './playback';

/**
 * The specimens (docs/site.md §6). Each renders the real library components with
 * Kasane data from src/data.ts, as a list of frames the player steps through
 * (src/playback.tsx). The last frame is the rest frame, the one the prerendered
 * HTML shows.
 */

/** The question the hero and the chat specimens answer (D5). Owner copy, 2026-10-26. */
const question = 'Did we pay any invoice twice?';

const noop = () => {};

// ---------------------------------------------------------------------------
// The proposal: the hero (D5, D6) and the Agent block card
// ---------------------------------------------------------------------------

type Outcome = 'waiting' | 'editing' | 'posted' | 'declined';
type FocusTarget = 'post' | 'edit' | 'period' | 'replay' | null;

/**
 * The agent's proposal. In the hero it's a teaser (owner, 2026-10-26): it rests
 * on the waiting proposal with no buttons, and Replay plays the run back to it.
 * On the Agent block card it's live: it stops and waits, and the visitor is the
 * person it waits for (D6). On Agent block's pair it's fixed: the waiting plate
 * shows the three buttons, and the plate is inert, so they can't be pressed.
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
function Proposal({ hero = false, fixed }: { hero?: boolean; fixed?: 'waiting' | 'posted' }) {
  const d = duplicatePayment;
  const invoices = d.sources.find((s) => s.endsWith('.csv'));
  if (!invoices) throw new Error('kasane.json’s duplicate payment cites no invoice file');
  const defaults = { period: kasane.company.openPeriod, memo: 'Reverse the duplicate payment' };
  // The hero is a teaser, and a fixed proposal is a pair's plate: neither takes a decision.
  // A fixed proposal still shows its buttons while it waits (owner, 2026-10-28): they are
  // the component's point, and the pair's plate is inert.
  const live = !hero && !fixed;

  // Four frames: the question, the answer, its sources, the entry. The hero rests and never autoplays (D6).
  const { ref, frame, playing, play } = usePlayback({ frames: 4, autoplay: !hero && !fixed });
  const { announce, message } = useAnnouncer();
  const [outcome, setOutcome] = useState<Outcome>(fixed ?? 'waiting');
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
      if (live) setFocusTarget('post');
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
        {/* A part the run hasn't reached yet is hidden, not absent, so the plate
            keeps its rest height while it plays and Replay never makes it jump. */}
        <div {...unreached(frame < 1 && hero)}>
          <AgentBlock authorship={authorship} meta={meta}>
            <div className="flex flex-col gap-[var(--gap-group)]">
              <p>
                Yes. Invoice <code>{d.supplierInvoice}</code> was entered twice and{' '}
                {d.paid.every(Boolean) ? 'paid twice' : 'paid once'}, {d.amountLabel} each time.
              </p>
              <p className="text-text-secondary" {...unreached(frame < 2)}>
                Found in <code>{packFile(invoices)}</code>. I can reverse the second entry, <code>{d.reverse}</code>, so
                the supplier owes it back.
              </p>
              <div {...unreached(frame < 3)}>
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
                        {d.amountLabel}. The amount is the duplicate’s, and can’t be changed here.
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
                        {d.amountLabel}, period {entry.period}
                        {outcome === 'posted' ? (
                          <>
                            , <code>{d.nextJournalId}</code>
                          </>
                        ) : null}
                      </p>
                    </>
                  )}
                  {outcome === 'waiting' && !hero ? (
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
              </div>
            </div>
          </AgentBlock>
        </div>
        {/* The run log row, written once a person decides (D6). Nothing holds its
            place before then: the dashed slot was removed (owner, 2026-10-26). */}
        {outcome === 'posted' ? (
          <RunLogRow status="passed" name={d.nextJournalId} />
        ) : outcome === 'declined' ? (
          <RunLogRow status="skipped" name={d.reverse} />
        ) : null}
      </div>
      {hero || (decided && live) ? (
        <div ref={replayRef} className="flex justify-end">
          <ReplayButton title={hero ? 'the hero’s run' : 'Agent block'} onClick={replay} />
        </div>
      ) : null}
      <LiveRegion message={message} />
    </div>
  );
}

/** Hides a part the run hasn't reached: invisible, so it holds its space, and out of the accessibility tree. */
function unreached(hidden: boolean) {
  return hidden ? { className: 'invisible', 'aria-hidden': true as const } : {};
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

// ---------------------------------------------------------------------------
// Sources and Inline citation: what the duplicate-payment answer rests on (D5)
// ---------------------------------------------------------------------------

/** A pack file as a Source, with its size. No link: the site serves no pack files. */
function packSource(name: string): Source {
  const file = kasane.pack.find((f) => f.name === packFile(name))!;
  return { id: file.name, name: file.name, size: formatBytes(file.bytes) };
}

const answerSources = (() => {
  const invoices = duplicatePayment.sources.find((s) => s.endsWith('.csv'));
  const interview = duplicatePayment.sources.find((s) => s.endsWith('.txt'));
  if (!invoices || !interview)
    throw new Error('kasane.json’s duplicate payment no longer cites an invoice file and an interview');
  // Citation order: the figure's file first, then the interview.
  return [packSource(invoices), packSource(interview)];
})();

const bankFiles = kasane.pack.filter((f) => f.name.startsWith('bank_export_')).map((f) => f.name);

/** An identifier in a --text-sm line: mono, one step below (§8.3). */
function Ident({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-xs">{children}</code>;
}

/**
 * What the answer didn't check, from the pack itself: the only bank file isn't
 * the entity's, and the invoice file covers H1. Approved by the owner, 2026-10-28.
 */
const notChecked = [
  <>
    {duplicatePayment.entity}’s bank statements: the only bank file is <Ident>{bankFiles.join(', ')}</Ident>, so both
    payments are as the invoice file records them.
  </>,
  <>
    Invoices outside H1: <Ident>{answerSources[0].name}</Ident> holds H1 only.
  </>,
];

/** The answer's two sentences, each figure marked with its source when `cited`. */
function CitedAnswer({ cited }: { cited: boolean }) {
  const d = duplicatePayment;
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <p>
        Yes. Invoice <code>{d.supplierInvoice}</code> was entered twice and{' '}
        {d.paid.every(Boolean) ? 'paid twice' : 'paid once'}, <span className="tabular-nums">{d.amountLabel}</span> each
        time.
        {cited ? <InlineCitation number={1} source={answerSources[0]} locator={d.entries.join(' and ')} /> : null}
      </p>
      <p className="text-text-secondary">
        AP says the system blocks a repeated supplier invoice number.
        {cited ? <InlineCitation number={2} source={answerSources[1]} /> : null}
      </p>
    </div>
  );
}

/** Sources: the files the answer read, one after another, then what it didn't check. */
export function SourcesSpecimen() {
  return (
    <Specimen title="Sources" frames={answerSources.length}>
      {(f) => (
        <AgentBlock authorship="AI">
          <Sources sources={answerSources.slice(0, f + 1)} notChecked={notChecked} />
        </AgentBlock>
      )}
    </Specimen>
  );
}

/** Inline citation: the answer, then each figure marked with its source. Press a mark to open it. */
export function CitationSpecimen() {
  return (
    <Specimen title="Inline citation" frames={2}>
      {(f) => (
        <AgentBlock authorship="AI">
          <CitedAnswer cited={f === 1} />
        </AgentBlock>
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

const runFailure = 'No header row, so its six columns can’t be matched to fields. Skipped; the other files were read.';

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
              <RunLogRow key={`${name}-failed`} status="failed" name={name} defaultOpen detail={runFailure} />
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

// ---------------------------------------------------------------------------
// The before/after pairs (docs/site.md D2): two states that prove each decision
// ---------------------------------------------------------------------------

/**
 * One composition per built component: its two states and the caption beneath.
 * Every caption is approved (owner, 2026-10-28).
 *
 * A plate with a control is inert, so a press can't turn the before into the
 * after (owner, 2026-10-28). Inert also takes the plate out of the accessibility
 * tree, so a screen reader hears the caption; each component's live card on Home
 * is the version it can use. A pair whose plates hold no control sets
 * `inert: false`, so they stay readable and selectable. So does Inline citation:
 * its caption asks the reader to press the mark, and the popover opens over the
 * plate and leaves it as it was. `tests/pages.spec.ts` holds the rule.
 */
type PairParts = { before: React.ReactNode; after: React.ReactNode; caption: string; inert?: false };

function chatStarterPair(): PairParts {
  return {
    before: (
      <ChatStarter
        description={`Ask about ${kasane.company.name}’s books, from the files it shared.`}
        suggestions={suggestions}
        onSelect={noop}
      />
    ),
    after: <ChatComposer value={question} onValueChange={noop} onSend={noop} />,
    caption: 'Picking a question fills the box without sending it, so you can still edit it.',
  };
}

function composerPair(): PairParts {
  const file = kasane.pack.find((f) => f.name === packFile('trial_balance_monthly.csv'))!;
  const attachment = (status: RunStatus) => [{ id: file.name, name: file.name, size: formatBytes(file.bytes), status }];
  return {
    before: <ChatComposer value={question} onValueChange={noop} onSend={noop} attachments={attachment('running')} />,
    after: <ChatComposer value={question} onValueChange={noop} onSend={noop} attachments={attachment('passed')} />,
    caption: 'Nothing sends while a file is still uploading.',
  };
}

function reasoningPair(): PairParts {
  return {
    before: (
      <AgentBlock authorship="AI">
        <AgentReasoning status="streaming" text={reasoningText} />
      </AgentBlock>
    ),
    after: (
      <AgentBlock authorship="AI">
        <div className="flex flex-col gap-[var(--gap-group)]">
          <AgentReasoning status="done" text={reasoningText} defaultOpen />
          <p>
            H1 operating profit is {money(h1Gap.shortfall)} under budget. Exchange rates explain{' '}
            {money(h1Gap.exchangeRates)} of it.
          </p>
        </div>
      </AgentBlock>
    ),
    caption: 'The reasoning stays folded while the AI thinks. Open it to read the steps.',
  };
}

function planPair(): PairParts {
  const plan = (status: 'streaming' | 'ready', count: number) => (
    <AgentBlock authorship="AI">
      <AgentPlan
        title="Explain the H1 gap"
        description={`Split the ${money(h1Gap.shortfall)} between exchange rates and performance, and trace each part to its entries.`}
        status={status}
        steps={planSteps.slice(0, count)}
      />
    </AgentBlock>
  );
  return {
    before: plan('streaming', 2),
    after: plan('ready', planSteps.length),
    caption: 'Steps appear as the plan is written. Run plan waits for the last one.',
  };
}

function lineagePair(): PairParts {
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
  return {
    before: <LineageTree defaultExpanded={[]} nodes={nodes} />,
    after: <LineageTree defaultExpanded={['actual']} nodes={nodes} />,
    caption: 'Open a line to see what it’s built from, without leaving the page.',
  };
}

function attachmentPair(): PairParts {
  const files = attachmentFiles.map((name) => kasane.pack.find((f) => f.name === packFile(name))!);
  const rows = (statusAt: (i: number) => RunStatus) => (
    <div className="flex flex-col">
      {files.map((file, i) => (
        <AttachmentRow key={file.name} name={file.name} size={formatBytes(file.bytes)} status={statusAt(i)} />
      ))}
    </div>
  );
  return {
    before: rows((i) => (i === 0 ? 'running' : 'queued')),
    after: rows(() => 'passed'),
    caption: 'Each file shows its own state. Its name stays text you can select and copy.',
    inert: false,
  };
}

function sourcesPair(): PairParts {
  return {
    before: (
      <AgentBlock authorship="AI">
        <div className="flex flex-col gap-[var(--gap-group)]">
          <CitedAnswer cited={false} />
          <p className="text-text-secondary">
            Found in <code>{answerSources[0].name}</code>.
          </p>
        </div>
      </AgentBlock>
    ),
    after: (
      <AgentBlock authorship="AI">
        <div className="flex flex-col gap-[var(--gap-group)]">
          <CitedAnswer cited />
          <Sources sources={answerSources} notChecked={notChecked} />
        </div>
      </AgentBlock>
    ),
    caption: 'The answer lists every file it read, and says what it didn’t check.',
  };
}

function citationPair(): PairParts {
  return {
    before: (
      <AgentBlock authorship="AI">
        <CitedAnswer cited={false} />
      </AgentBlock>
    ),
    after: (
      <AgentBlock authorship="AI">
        <CitedAnswer cited />
      </AgentBlock>
    ),
    caption: 'Each figure names its source in its own line. Press the mark for the file and the entries.',
    inert: false,
  };
}

function agentBlockPair(): PairParts {
  return {
    before: <Proposal fixed="waiting" />,
    after: <Proposal fixed="posted" />,
    caption: 'The AI proposes the entry. Only a person can post it, with Post entry.',
  };
}

function threadPair(): PairParts {
  const answer = `Yes. ${duplicatePayment.entity} paid supplier invoice ${duplicatePayment.supplierInvoice} twice, ${duplicatePayment.amountLabel} each.`;
  const thread = (text?: string) => (
    <div className="flex aspect-video flex-col">
      <ChatThread
        turns={[
          { id: 'q', role: 'user', text: question },
          { id: 'a', role: 'assistant', text },
        ]}
      />
    </div>
  );
  return {
    before: thread(),
    after: thread(answer),
    caption: 'The reply shows Working… as soon as you ask, then the answer takes its place.',
  };
}

function runLogPair(): PairParts {
  const names = runFiles.map(packFile);
  const rows = (open: boolean) => (
    <div className="flex flex-col">
      <RunLogRow status="passed" name={names[0]} />
      <RunLogRow status="passed" name={names[1]} />
      <RunLogRow status="failed" name={names[2]} defaultOpen={open} detail={runFailure} />
    </div>
  );
  return { before: rows(false), after: rows(true), caption: 'A failed row opens to its error in place.' };
}

function statusPair(): PairParts {
  return {
    before: <StatusBadge status="agent-working" />,
    after: <StatusBadge status="agent-proposed" />,
    caption: 'Each badge says what’s happening now: AI working, then proposed.',
    inert: false,
  };
}

/** Each built component's pair, by registry name. */
const pairs: Record<string, () => PairParts> = {
  'chat-starter': chatStarterPair,
  'chat-composer': composerPair,
  'agent-reasoning': reasoningPair,
  'agent-plan': planPair,
  'lineage-tree': lineagePair,
  'attachment-row': attachmentPair,
  'inline-citation': citationPair,
  sources: sourcesPair,
  'agent-block': agentBlockPair,
  'chat-thread': threadPair,
  'run-log-row': runLogPair,
  'status-badge': statusPair,
};

/** A built component's before/after pair, on dark plates (D2, D3). */
export function ComponentPair({ name }: { name: string }) {
  const parts = pairs[name]?.();
  if (!parts) throw new Error(`No before/after pair for ${name}`);
  return <Pair {...parts} />;
}
