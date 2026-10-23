import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, within } from 'storybook/test';

import { useReducedMotion } from '../../../lib/motion';
import { Button } from '../../foundational/Button';
import type { AgentPlanStep } from '../AgentPlan';
import { AppShellPanelFooter, AppShellPanelHeader } from '../AppShell';
import { ChatComposer } from '../ChatComposer';
import { ChatThread, type ChatAssistantTurn, type ChatTurn } from './index';

/**
 * §8.3: identifiers in mono, one step below the sans around them: `sm` beside
 * --text-base (steps, assistant text), `xs` beside --text-sm (reasoning, the
 * plan's description).
 */
function Ident({ children, size = 'sm' }: { children: string; size?: 'sm' | 'xs' }) {
  return <code className={size === 'sm' ? 'font-mono text-sm' : 'font-mono text-xs'}>{children}</code>;
}

/** Story helper: `backticked` names become <Ident>, the rest stays text. */
function mono(text: string, size: 'sm' | 'xs' = 'sm') {
  return text.split(/`([^`]+)`/).map((part, i) =>
    i % 2 ? (
      <Ident key={i} size={size}>
        {part}
      </Ident>
    ) : (
      part
    ),
  );
}

const question: ChatTurn = {
  id: 'q-revenue',
  role: 'user',
  text: 'The raw_erp.sales_orders table changed: order_total is now split into net_amount and tax_amount. Can you rebuild the revenue model?',
};

const reasoningText = mono(
  `\`fct_revenue\` reads \`order_total\` in two places, and \`mart_revenue_monthly\` sums it.
Revenue should be net of tax, so \`net_amount\` replaces \`order_total\`.
Tax gets its own column so the monthly totals still reconcile.`,
  'xs',
);

const steps: AgentPlanStep[] = [
  {
    id: 'stage',
    label: (
      <>
        Select <Ident>net_amount</Ident> and <Ident>tax_amount</Ident> in <Ident>stg_sales__orders</Ident>
      </>
    ),
  },
  {
    id: 'fact',
    label: (
      <>
        Replace <Ident>order_total</Ident> with <Ident>net_amount</Ident> in <Ident>fct_revenue</Ident>
      </>
    ),
  },
  {
    id: 'rebuild',
    label: (
      <>
        Rebuild <Ident>fct_revenue</Ident> and <Ident>mart_revenue_monthly</Ident>
      </>
    ),
  },
  { id: 'compare', label: 'Compare monthly revenue with the last run and flag any month that moved more than 0.5%' },
];

/**
 * The scripted conversation, one stage at a time. 0: the question alone.
 * 1: the answer's block, working. 2: thinking. 3–6: the plan streaming with
 * 0–3 steps. 7: the plan complete.
 */
const LAST_STAGE = 7;
function conversationAt(stage: number): { turns: ChatTurn[]; busy: boolean } {
  if (stage === 0) return { turns: [question], busy: true };
  const answer: ChatAssistantTurn = { id: 'a-revenue', role: 'assistant', meta: '14:22' };
  if (stage >= 2) {
    answer.reasoning =
      stage === 2
        ? { text: reasoningText, status: 'streaming' }
        : { text: reasoningText, status: 'done', durationSeconds: 2 };
  }
  if (stage >= 3) {
    answer.plan = {
      title: 'Rebuild revenue model',
      description: mono('Switch revenue to `net_amount` and check the monthly totals still reconcile.', 'xs'),
      steps: steps.slice(0, Math.min(stage - 3, steps.length)),
      status: stage >= LAST_STAGE ? 'ready' : 'streaming',
    };
  }
  return { turns: [question, answer], busy: stage < LAST_STAGE };
}

/** Milliseconds before each stage after the first: about six seconds in all. */
const STAGE_DELAYS = [300, 1200, 1600, 700, 700, 700, 700];

/**
 * Steps through the stages on a timer. Shows the last stage at once under
 * reduced motion, and when a browser is automated (`navigator.webdriver`):
 * the screenshot and story tests then see one stable frame instead of
 * whichever stage the timer had reached.
 */
function usePlayback() {
  const reduced = useReducedMotion();
  const instant = reduced || navigator.webdriver;
  const [stage, setStage] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (instant) return;
    let elapsed = 0;
    const timers = STAGE_DELAYS.map((delay, i) => {
      elapsed += delay;
      return setTimeout(() => setStage(i + 1), elapsed);
    });
    return () => timers.forEach(clearTimeout);
  }, [instant, run]);
  const replay = () => {
    setStage(0);
    setRun((n) => n + 1);
  };
  return [instant ? LAST_STAGE : stage, replay] as const;
}

/** The chat panel: 440px, header, thread, composer. Bounded height, as in the shell. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-[var(--w-panel)] flex-col border-x border-border bg-surface" style={{ height: 720 }}>
      <AppShellPanelHeader title="Chat" />
      {children}
      <AppShellPanelFooter>
        <ChatComposer onSend={() => {}} />
      </AppShellPanelFooter>
    </div>
  );
}

const meta = {
  title: 'Product/ChatThread',
  component: ChatThread,
  parameters: { layout: 'padded' },
  args: { turns: [] },
} satisfies Meta<typeof ChatThread>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A business analyst asks for the revenue model to be rebuilt after a source
 * table changed. The assistant thinks briefly, then streams a four-step plan,
 * over about six seconds. Replay runs it again. Under reduced motion, the
 * finished conversation shows at once.
 */
export const ScriptedConversation: Story = {
  render: function Render() {
    const [stage, replay] = usePlayback();
    const { turns, busy } = conversationAt(stage);
    return (
      <div className="flex flex-col items-start gap-[var(--gap-field)]">
        <Button size="sm" variant="outline" onClick={replay}>
          Replay
        </Button>
        <Panel>
          <ChatThread turns={turns} busy={busy} />
        </Panel>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Automated, so the finished conversation.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('log')).not.toHaveAttribute('aria-busy');
    await expect(canvas.getByRole('heading', { name: 'Rebuild revenue model' })).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
    await expect(canvas.getByRole('button', { name: 'Thought for 2s' })).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByRole('button', { name: 'Run plan' })).toBeEnabled();
  },
};

/**
 * The same conversation, frozen while the plan streams: two steps in, the
 * third drafting. It never finishes.
 */
export const PlanStreaming: Story = {
  args: conversationAt(5),
  render: (args) => (
    <Panel>
      <ChatThread {...args} />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('log')).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.getByText('Drafting step 3…')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Run plan' })).toBeDisabled();
  },
};

/**
 * The question is sent and nothing has come back yet. The answer's block is
 * already there, working, so the answer grows in place.
 */
export const AwaitingResponse: Story = {
  args: conversationAt(1),
  render: (args) => (
    <Panel>
      <ChatThread {...args} />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('log')).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByText('Working…')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /Thinking|Thought/ })).toBeNull();
  },
};

/**
 * Files sent with a question list above it, in the user's turn, so the thread
 * records what the agent was given. A message can be the files alone.
 */
export const WithAttachments: Story = {
  args: {
    turns: [
      {
        id: 'q-files',
        role: 'user',
        text: 'Does September reconcile with fct_gl_entries?',
        attachments: [
          { id: 'f1', name: 'journal_entries_2026-09.csv', size: '2.4 MB' },
          { id: 'f2', name: 'close_memo_2026-09.md', size: '4 KB' },
        ],
      },
      {
        id: 'a-files',
        role: 'assistant',
        meta: '14:22',
        text: 'September reconciles to fct_gl_entries within 0.02%. The gap is three entries posted on 30 September after the extract ran.',
      },
      { id: 'q-only', role: 'user', attachments: [{ id: 'f3', name: 'ap_aging_2026-09.xlsx', size: '880 KB' }] },
    ],
  },
  render: (args) => (
    <Panel>
      <ChatThread {...args} />
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lists = canvas.getAllByRole('list', { name: 'Attached files' });
    await expect(lists).toHaveLength(2);
    await expect(within(lists[0]).getAllByRole('listitem')).toHaveLength(2);
    // Files above the question, glyphs on the text's left edge.
    const question = canvas.getByText('Does September reconcile with fct_gl_entries?');
    await expect(lists[0].getBoundingClientRect().bottom).toBeLessThanOrEqual(question.getBoundingClientRect().top);
    await expect(lists[0].querySelector('svg')!.getBoundingClientRect().left).toBe(
      question.getBoundingClientRect().left,
    );
  },
};

/**
 * Two earlier exchanges above the revenue conversation. A saved thread opens
 * at its last question, not the absolute bottom, with the earlier turns a
 * scroll away.
 */
export const LongThread: Story = {
  args: {
    turns: [
      { id: 'q-load', role: 'user', text: 'Did the SAP delta load finish?' },
      {
        id: 'a-load',
        role: 'assistant',
        meta: '09:04',
        text: mono(
          'Yes, at 06:12. `stg_sap__bkpf` picked up 412,880 rows. `dim_accounts` then failed its uniqueness test on `account_id`: 412 duplicate rows came from the delta window overlapping the prior load.',
        ),
      },
      { id: 'q-dedupe', role: 'user', text: 'Add the dedupe and re-run it.' },
      {
        id: 'a-dedupe',
        role: 'assistant',
        meta: '09:11',
        reasoning: {
          text: mono('Keying on (`account_id`, `valid_from`) keeps the latest load per account.', 'xs'),
          status: 'done',
          durationSeconds: 3,
        },
        text: mono('Done. `dim_accounts` passes all six tests, and `fct_ap_aging` has rebuilt.'),
      },
      ...conversationAt(LAST_STAGE).turns,
    ],
  },
  render: (args) => (
    <Panel>
      <ChatThread {...args} />
    </Panel>
  ),
};
