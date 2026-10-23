import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { AgentPlan, type AgentPlanStep } from './index';

/** §8.3: identifiers in mono, one step below the --text-base step label. */
function Ident({ children }: { children: string }) {
  return <code className="font-mono text-sm">{children}</code>;
}

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
 * AgentPlan is a part of an AgentBlock, so every story renders it inside one,
 * at the chat panel's width (--w-panel) on the panel's ground.
 */
const meta = {
  title: 'Product/AgentPlan',
  component: AgentPlan,
  parameters: { layout: 'padded' },
  args: {
    title: 'Rebuild revenue model',
    description: (
      <>
        Switch revenue to {/* --text-xs: one step below the --text-sm description (§8.3). */}
        <code className="font-mono text-xs">net_amount</code> and check the monthly totals still reconcile.
      </>
    ),
    steps,
    status: 'ready',
  },
  decorators: [
    (Story) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship="AI" meta="14:22">
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof AgentPlan>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Complete: four steps, both actions live. */
export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Rebuild revenue model' })).not.toHaveAttribute('aria-busy');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
    await expect(canvas.getByRole('button', { name: 'Run plan' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Edit' })).toBeEnabled();
  },
};

/** Two of four steps in. The next is drafting, and nothing can run yet. */
export const Streaming: Story = {
  args: { status: 'streaming', steps: steps.slice(0, 2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('region', { name: 'Rebuild revenue model' })).toHaveAttribute('aria-busy', 'true');
    // The drafting row is not a step: the list holds only what has arrived.
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    await expect(canvas.getByText('Drafting step 3…')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Run plan' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Edit' })).toBeDisabled();
  },
};

/** Title and sentence are in, no steps yet. */
export const StreamingNoSteps: Story = {
  args: { status: 'streaming', steps: [] },
};

/** Ten steps: the number column holds two digits on one right edge. */
export const ManySteps: Story = {
  args: {
    steps: [
      ...steps,
      { id: 'region', label: 'Rebuild rpt_sales_by_region' },
      { id: 'ltv', label: 'Rebuild rpt_customer_ltv' },
      { id: 'tests', label: 'Run the revenue tests' },
      { id: 'diff', label: 'Diff each report against the last run' },
      { id: 'notes', label: 'Write up which months moved, and why' },
      { id: 'review', label: 'Ask finance to review the September figures' },
    ],
  },
};

/** Long copy wraps; nothing truncates. */
export const LongText: Story = {
  args: {
    title: 'Rebuild revenue and margin models after the ERP order table split its totals',
    description:
      'Switch revenue to net_amount, move tax into its own column, and check the monthly totals still reconcile with the general ledger.',
  },
};
