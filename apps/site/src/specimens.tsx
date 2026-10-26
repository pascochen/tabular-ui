import { AgentBlock, AgentPlan, AgentReasoning, Button } from 'tabular-ui';

import { duplicatePayment, h1Gap, kasane, packFile } from './data';
import { money } from './lib/format';

/**
 * The specimens, at rest (docs/site.md §6). Each renders the real library
 * components with Kasane data from src/data.ts. PR 4 adds the playback; until
 * then each shows the frame it rests on, which is also what the prerendered
 * HTML, link previews and reduced motion show.
 */

/**
 * The hero (D5, D6): the agent has found the duplicate payment and stops,
 * waiting for a person, with the proposed reversal and its three choices.
 *
 * The question is a plain line, not a ChatThread user turn: ChatThread's
 * assistant turn takes no actions, and a proposal block can't sit inside its
 * block (one AgentBlock per turn). Raised in the PR as a library gap.
 */
export function HeroSpecimen() {
  const d = duplicatePayment;
  const [first, second] = d.entries;
  return (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <p className="text-text-secondary">
        <span className="font-medium text-text-body">Question:</span> Did we pay any supplier twice this half?
      </p>
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
      {/* Holds the run log row's space (D6). Dashed means placeholder (§7.8). Draft copy. */}
      <p className="border border-dashed border-border-strong px-[var(--pad-card)] py-2 text-sm text-text-secondary">
        Run log row is written here after Post.
      </p>
    </div>
  );
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
