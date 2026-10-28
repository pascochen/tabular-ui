import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { InlineCitation } from '../InlineCitation';
import { Sources, type Source } from './index';

/**
 * Kasane's duplicate payment: KUS entered supplier invoice MFL-58821 twice and
 * paid both. The names and sizes are the Kasane pack's.
 */
const sources: Source[] = [
  { id: 'invoices', name: 'supplier_invoices_fy2026_h1.csv', size: '116 KB', href: '#' },
  { id: 'interview', name: '05_interview_ar_ap_2026-10-14.txt', size: '4 KB', href: '#' },
];

const notChecked = [
  'KUS’s bank statements: the pack holds KJP’s September export only, so both payments are as the invoice file records them.',
  'Invoices after September: the supplier file covers H1.',
];

/**
 * Sources is a part of an AgentBlock when the agent wrote the answer, so every
 * story renders it inside one, at the chat panel's width on the panel's ground.
 */
const meta = {
  title: 'Product/Sources',
  component: Sources,
  parameters: { layout: 'padded' },
  args: { sources, notChecked },
  decorators: [
    (Story) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship="AI" meta="14:22">
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof Sources>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What the answer rests on, numbered, and what it doesn't cover. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Sources' });
    const rows = within(list).getAllByRole('listitem');
    await expect(rows).toHaveLength(2);
    await expect(rows[0]).toHaveTextContent(/^1supplier_invoices_fy2026_h1\.csv/);
    // The name is the link, as in AttachmentRow.
    await expect(within(rows[0]).getByRole('link', { name: 'supplier_invoices_fy2026_h1.csv' })).toBeVisible();
    await expect(within(canvas.getByRole('list', { name: 'Not checked' })).getAllByRole('listitem')).toHaveLength(2);
  },
};

/**
 * Passing `notChecked={[]}` is a claim, so the component writes it out. There
 * is no way to list sources and say nothing about what's left.
 */
export const NothingUnchecked: Story = {
  args: { notChecked: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('list', { name: 'Not checked' })).toBeNull();
    await expect(canvas.getByText('Nothing. Every part of the question was checked.')).toBeVisible();
  },
};

/**
 * The pair in use: each figure in the answer carries an `InlineCitation`
 * whose number is its source's row.
 */
export const WithCitations: Story = {
  render: (args) => (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <p>
        Yes. Invoice <code className="font-mono text-sm">MFL-58821</code> was entered twice and paid twice,{' '}
        <span className="tabular-nums">$48,216.40</span> each time.
        <InlineCitation number={1} source={sources[0]} locator="API-KUS-2607-00007 and API-KUS-2607-00011" />
      </p>
      <p className="text-text-secondary">
        AP said the system blocks a repeated invoice number in every entity.
        <InlineCitation number={2} source={sources[1]} />
      </p>
      <Sources {...args} />
    </div>
  ),
};

/**
 * Long names truncate in their row, as AttachmentRow's do, and a long
 * not-checked line wraps: it's a sentence, and a cut one says less than it
 * should. Ten sources keep their numbers aligned.
 */
export const Overflow: Story = {
  args: {
    sources: Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      name: i === 2 ? 'manual_journal_entries_fy2026_h1_including_reversals_and_reclasses.csv' : `source_${i + 1}.csv`,
      size: '12 KB',
      href: '#',
    })),
    notChecked: [
      'Intercompany balances between KJP and KCN: the pack has no intercompany schedule, and the trial balance nets them, so a mismatch would not show in any file I read.',
    ],
  },
};
