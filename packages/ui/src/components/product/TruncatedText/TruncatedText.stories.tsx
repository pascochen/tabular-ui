import type { Meta, StoryObj } from '@storybook/react-vite';

import { TruncatedText } from './index';

/**
 * Mode is driven by the toolbar Theme control ([data-theme] on the root).
 * Hover a cut-off line to see the full text; a line that fits gets no tooltip.
 */
const meta = {
  title: 'Product/TruncatedText',
  component: TruncatedText,
  parameters: { layout: 'padded' },
  args: { children: 'fct_gl_entries_reconciliation_daily_v2' },
  decorators: [
    (Story) => (
      // A bounded width, as every real parent gives it. Unbounded, nothing
      // ever truncates.
      <div className="flex w-60 text-base text-text-body">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TruncatedText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cut off at 240px: ellipsis, and the full text in a tooltip on hover. */
export const Truncated: Story = {};

/** Fits: no ellipsis and no tooltip. Repeating a visible label is noise. */
export const Fits: Story = {
  args: { children: 'dim_accounts' },
};

/**
 * The dense case: a list of 28px rows of mono identifiers, mixed lengths,
 * the way a sidebar or a table column holds them. Only the cut-off rows get
 * a tooltip, inline-end so it covers no neighbouring row.
 */
export const DenseRows: Story = {
  decorators: [],
  render: () => {
    const models = [
      'fct_gl_entries_reconciliation_daily_v2',
      'dim_accounts',
      'stg_sap__bkpf_incremental_partitioned',
      'fct_ap_aging',
    ];
    return (
      <ul role="list" className="flex w-60 flex-col rounded-md border border-border">
        {models.map((model, i) => (
          <li
            key={model}
            className={`flex h-[var(--h-row-sm)] items-center px-[var(--pad-cell-x)] ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <TruncatedText side="inline-end" className="font-mono text-xs text-text-body">
              {model}
            </TruncatedText>
          </li>
        ))}
      </ul>
    );
  },
};
