import {
  AgentBlock,
  AgentPlan,
  AgentReasoning,
  AttachmentRow,
  Button,
  ChatComposer,
  ChatStarter,
  ChatThread,
  LineageTree,
  RunLogRow,
  runStatuses,
  StatusBadge,
  type RunStatus,
} from 'tabular-ui';

import { duplicatePayment, h1Gap, kasane, packFile } from './data';
import { exactMoney, formatBytes, money } from './lib/format';

/**
 * The specimens, at rest (docs/site.md §6). Each renders the real library
 * components with Kasane data from src/data.ts. PR 4 adds the playback; until
 * then each shows the frame it rests on, which is also what the prerendered
 * HTML, link previews and reduced motion show.
 */

/** The question the hero and the chat specimens answer (D5). Draft copy. */
const question = 'Did we pay any supplier twice this half?';

/**
 * The agent's proposal (D5): the duplicate payment found, with the reversal it
 * proposes and the three choices. The hero and the Agent block card show it.
 */
function ProposalBlock() {
  const d = duplicatePayment;
  const [first, second] = d.entries;
  return (
    <AgentBlock authorship="AI · Awaiting review">
      <div className="flex flex-col gap-[var(--gap-group)]">
        <p>
          Yes. {d.entity} entered supplier invoice <code>{d.supplierInvoice}</code> twice, as <code>{first}</code> and{' '}
          <code>{second}</code>, {d.amountLabel} each, and {d.paid.every(Boolean) ? 'paid both' : 'paid one'}.
        </p>
        <p className="text-text-secondary">
          From <code>{packFile(d.sources[0])}</code> and <code>{packFile(d.sources[1])}</code>. I can reverse{' '}
          <code>{d.reverse}</code>, so the supplier owes the amount back.
        </p>
        <div className="flex flex-col gap-[var(--gap-bonded)] border border-border p-[var(--pad-card)]">
          <p className="text-xs font-medium text-text-secondary">Proposed journal entry</p>
          <p className="font-medium text-text-primary">
            Reverse duplicate invoice <code>{d.reverse}</code>
          </p>
          <p className="text-text-secondary">
            {d.entity}, {d.amountLabel}, period {kasane.company.openPeriod}
          </p>
          {/* Live in PR 4 (D6): Post entry turns the block to "AI · Posted". */}
          <div className="mt-2 flex flex-wrap gap-[var(--gap-inline)]">
            <Button size="sm">Post entry</Button>
            <Button size="sm" variant="outline">
              Edit entry
            </Button>
            <Button size="sm" variant="outline">
              Don’t post
            </Button>
          </div>
        </div>
      </div>
    </AgentBlock>
  );
}

/**
 * The hero (D5, D6): the agent has found the duplicate payment and stops,
 * waiting for a person.
 *
 * The question is a plain line, not a ChatThread user turn: ChatThread's
 * assistant turn takes no actions, and a proposal block can't sit inside its
 * block (one AgentBlock per turn). A library gap, raised in PR 2.
 */
export function HeroSpecimen() {
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <p className="text-text-secondary">
        <span className="font-medium text-text-body">Question:</span> {question}
      </p>
      <ProposalBlock />
      {/* Holds the run log row's space (D6). Dashed means placeholder (§7.8). Draft copy. */}
      <p className="border border-dashed border-border-strong px-[var(--pad-card)] py-2 text-sm text-text-secondary">
        Run log row is written here after Post.
      </p>
    </div>
  );
}

/** Agent block, at rest: the proposal, waiting. */
export function AgentBlockSpecimen() {
  return <ProposalBlock />;
}

/** Agent reasoning, at rest: folded, with the answer it led to (D5, the H1 gap). */
export function ReasoningSpecimen() {
  return (
    <AgentBlock authorship="AI">
      <div className="flex flex-col gap-[var(--gap-group)]">
        <AgentReasoning
          status="done"
          text={`Read ${packFile('trial_balance_monthly.csv')} and ${packFile('budget_forecast_monthly.csv')}. Translated each entity at budget rates, then compared H1 with budget.`}
        />
        <p>
          H1 operating profit is {money(h1Gap.shortfall)} under budget. Exchange rates explain{' '}
          {money(h1Gap.exchangeRates)} of it.
        </p>
      </div>
    </AgentBlock>
  );
}

/** Agent plan, at rest: written out and ready, before it runs. */
export function PlanSpecimen() {
  return (
    <AgentBlock authorship="AI">
      <AgentPlan
        title="Explain the H1 gap"
        description={`Split the ${money(h1Gap.shortfall)} between exchange rates and performance, and trace each part to its entries.`}
        status="ready"
        steps={[
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
        ]}
      />
    </AgentBlock>
  );
}

const noop = () => {};

/** Chat starter, at rest: suggestions written as a person would ask them. A pick fills the box and never sends. Draft copy. */
export function ChatStarterSpecimen() {
  return (
    <ChatStarter
      description={`Ask about ${kasane.company.name}’s books, from the files it shared.`}
      suggestions={['Explain the H1 operating profit gap', question, 'Which customers pay later each month?']}
      onSelect={noop}
    />
  );
}

/** Chat composer, at rest: a file still uploading holds Send. */
export function ComposerSpecimen() {
  const file = kasane.pack.find((f) => f.name === packFile('trial_balance_monthly.csv'));
  return (
    <ChatComposer
      placeholder={`Ask about ${kasane.company.name}’s books…`}
      onSend={noop}
      onAttach={noop}
      attachments={file ? [{ id: file.name, name: file.name, size: formatBytes(file.bytes), status: 'running' }] : []}
    />
  );
}

/**
 * Lineage tree, at rest: H1 operating profit opened down to its bridge, in exact
 * yen, so the parts add up to the total (D5). tests/tokens.spec.ts checks they do.
 */
export function LineageSpecimen() {
  const bridge = kasane.operatingBridge;
  return (
    <LineageTree
      defaultExpanded={['actual']}
      nodes={[
        {
          id: 'actual',
          name: 'H1 operating profit',
          meta: exactMoney(bridge.actual),
          children: [
            { id: 'budget', name: 'Budget', meta: exactMoney(bridge.budget) },
            ...bridge.steps.map((step) => ({ id: step.id, name: step.label, meta: exactMoney(step.value) })),
          ],
        },
      ]}
    />
  );
}

/** Attachment row, at rest: the files the answer rests on. */
export function AttachmentSpecimen() {
  const files = ['trial_balance_monthly.csv', 'budget_forecast_monthly.csv', 'forecast_memo_fy2026_6+6.md'].map(
    (name) => kasane.pack.find((f) => f.name === packFile(name))!,
  );
  return (
    <div className="flex flex-col">
      {files.map((f) => (
        <AttachmentRow key={f.name} name={f.name} size={formatBytes(f.bytes)} status="passed" />
      ))}
    </div>
  );
}

/**
 * Chat thread, at rest: the question asked, and the answer grown in the same place.
 * Its scroller needs a bounded parent; the aspect ratio bounds it without a height.
 */
export function ThreadSpecimen() {
  return (
    <div className="flex aspect-video flex-col">
      <ChatThread
        turns={[
          { id: 'q', role: 'user', text: question },
          {
            id: 'a',
            role: 'assistant',
            text: `Yes. ${duplicatePayment.entity} paid supplier invoice ${duplicatePayment.supplierInvoice} twice, ${duplicatePayment.amountLabel} each.`,
          },
        ]}
      />
    </div>
  );
}

/**
 * Run log row, at rest: the files read, one failed and opened to its error. The
 * failure is real: the bank export has no header row (findings.json,
 * bank-header). No times or durations: the data has none.
 */
export function RunLogSpecimen() {
  return (
    <div className="flex flex-col">
      <RunLogRow status="passed" name={packFile('trial_balance_monthly.csv')} />
      <RunLogRow status="passed" name={packFile('supplier_invoices_fy2026_h1.csv')} />
      <RunLogRow
        status="failed"
        name={packFile('bank_export_kjp_2026-09.csv')}
        defaultOpen
        detail="No header row, so its six columns can’t be matched to fields. Skipped; the other files were read."
      />
    </div>
  );
}

/** Status badge, at rest: every status the library ships, from runStatuses. */
export function StatusSpecimen() {
  return (
    <ul role="list" className="flex flex-wrap gap-[var(--gap-inline)]">
      {(Object.keys(runStatuses) as RunStatus[]).map((status) => (
        <li key={status}>
          <StatusBadge status={status} />
        </li>
      ))}
    </ul>
  );
}
