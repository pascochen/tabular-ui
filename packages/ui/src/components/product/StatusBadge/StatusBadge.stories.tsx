import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { StatusBadge } from './index';
import { runStatuses, runStatusRowTreatment, type RunStatus } from './statuses';
import { cn } from '../../../lib/utils';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/StatusBadge',
  component: StatusBadge,
  parameters: { layout: 'padded' },
  args: { status: 'passed' },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL = Object.keys(runStatuses) as RunStatus[];

export const Default: Story = {};

/** Every state in §5's table. Each carries an icon, not only a hue. */
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      {ALL.map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-group)' }}>
          <span className="text-text-secondary" style={{ width: 120, fontSize: 'var(--text-xs)' }}>
            {s}
          </span>
          <StatusBadge status={s} />
        </div>
      ))}
    </div>
  ),
};

/**
 * §10's grayscale gate. Every state must stay distinguishable with hue
 * removed — which is why each ships an icon.
 */
export const Grayscale: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap', filter: 'grayscale(1)' }}>
      {ALL.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};

/**
 * In a run log. Row-level treatments come from `runStatusRowTreatment`, not
 * from the badge — a badge cannot tint the row it sits in.
 */
export const InRunLog: Story = {
  render: () => {
    const rows: { model: string; status: RunStatus; rows: string }[] = [
      { model: 'fct_gl_entries', status: 'passed', rows: '1,284,102' },
      { model: 'dim_accounts', status: 'failed', rows: '8,214' },
      { model: 'stg_sap__bkpf', status: 'running', rows: '412,880' },
      { model: 'int_fx_rates_daily', status: 'stale', rows: '1,204' },
      { model: 'fct_ap_aging', status: 'agent-proposed', rows: '92,410' },
      { model: 'dim_calendar', status: 'queued', rows: '—' },
      { model: 'stg_sap__bseg', status: 'skipped', rows: '—' },
    ];
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          maxWidth: 520,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.model}
            // Padding as a class, not an inline style: the treatment takes 2px
            // off the left for the agent rail, and an inline style would win.
            className={cn(
              'flex h-[var(--h-row-sm)] items-center gap-[var(--pad-cell-x)] px-[var(--pad-cell-x)]',
              runStatusRowTreatment[r.status],
            )}
            style={{ borderTop: i === 0 ? undefined : '1px solid var(--color-border)' }}
          >
            <span
              className="font-mono text-text-body"
              style={{
                flex: 1,
                fontSize: 'var(--text-xs)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.model}
            </span>
            <span
              className="text-text-secondary"
              style={{
                width: 88,
                textAlign: 'right',
                fontSize: 'var(--text-sm)',
                fontVariantNumeric: 'var(--font-numeric)',
              }}
            >
              {r.rows}
            </span>
            <div style={{ width: 132, display: 'flex', justifyContent: 'flex-start' }}>
              <StatusBadge status={r.status} />
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Test only, hidden from the sidebar and docs: `runStatuses` entries carry
 * `tone`, and `role` (deprecated 2026-10-09) as the same value, so code that
 * still reads `.role` keeps working. Likewise `spin` for `working`.
 */
export const DeprecatedRoleField: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => <StatusBadge status="failed" />,
  play: async () => {
    for (const entry of Object.values(runStatuses)) {
      await expect(entry.role).toBe(entry.tone);
      // `spin` (deprecated 2026-10-20) mirrors `working` the same way.
      await expect(entry.spin).toBe(entry.working);
    }
    await expect(runStatuses.failed.tone).toBe('danger');
  },
};
