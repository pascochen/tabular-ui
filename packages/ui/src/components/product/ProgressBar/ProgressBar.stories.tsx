import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { ProgressBar } from './index';

const meta = {
  title: 'Product/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'padded' },
  args: { label: 'Progress' },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: 62, label: 'Run progress', showValue: true } };

/** Indeterminate — work with no known end. */
export const Indeterminate: Story = { args: { label: 'Compiling dbt project' } };

/** The hue must be true of the run (§0 rule 1), not of the number's size. */
export const Roles: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', width: 320 }}>
      {(
        [
          ['info', 62, 'Run in progress'],
          ['success', 100, 'Run complete'],
          ['warning', 84, 'Approaching row-count threshold'],
          ['danger', 96, 'Storage quota nearly exhausted'],
          ['agent', 40, 'AI rewriting model'],
        ] as const
      ).map(([tone, value, label]) => (
        <div key={tone} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
          <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
            {label}
          </span>
          <ProgressBar tone={tone} value={value} label={label} showValue />
        </div>
      ))}
    </div>
  ),
};

/** In a 28px row — 2px track so it does not fight the row's rhythm. */
export const InARow: Story = {
  render: () => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        maxWidth: 420,
      }}
    >
      {[
        ['stg_sap__bkpf', 100],
        ['int_fx_rates_daily', 64],
        ['fct_gl_entries', 28],
      ].map(([name, v], i) => (
        <div
          key={name as string}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--pad-cell-x)',
            height: 'var(--h-row-sm)',
            padding: '0 var(--pad-cell-x)',
            borderTop: i === 0 ? undefined : '1px solid var(--color-border)',
          }}
        >
          <span className="font-mono text-text-body" style={{ flex: 1, fontSize: 'var(--text-xs)' }}>
            {name}
          </span>
          <div style={{ width: 120 }}>
            <ProgressBar
              size="sm"
              value={v as number}
              label={`${name} progress`}
              tone={v === 100 ? 'success' : 'info'}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * Test only, hidden from the sidebar and docs: `role` is the deprecated
 * spelling of `tone` (renamed 2026-10-09), still honoured. The element keeps
 * role="progressbar" whatever is passed.
 */
export const DeprecatedRoleSpelling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    // eslint-disable-next-line no-restricted-syntax -- exercising the deprecated spelling on purpose
    <ProgressBar role="danger" value={40} label="Legacy" />
  ),
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Legacy' });
    await expect(bar.firstElementChild!.className).toContain('bg-fill-danger');
  },
};
