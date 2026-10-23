import type { Meta, StoryObj } from '@storybook/react-vite';

import { RunLogRow } from './index';
import type { RunStatus } from '../StatusBadge/statuses';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/RunLogRow',
  component: RunLogRow,
  parameters: { layout: 'padded' },
  args: { status: 'passed', name: 'fct_gl_entries', timestamp: '14:22:07', duration: '4.2s' },
} satisfies Meta<typeof RunLogRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const Log = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      maxWidth: 620,
    }}
  >
    {children}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Log>
      <RunLogRow {...args} />
    </Log>
  ),
};

/**
 * A real run log at 24px. This is the screen §11.2's icon-weight check and
 * §10's grayscale check are meant to be judged on.
 */
export const RunLog: Story = {
  render: () => {
    const entries: { status: RunStatus; name: string; timestamp: string; duration?: string }[] = [
      { status: 'passed', name: 'stg_sap__bkpf', timestamp: '14:21:02', duration: '1.8s' },
      { status: 'passed', name: 'stg_sap__bseg', timestamp: '14:21:04', duration: '2.4s' },
      { status: 'running', name: 'int_fx_rates_daily', timestamp: '14:21:07' },
      { status: 'failed', name: 'dim_accounts', timestamp: '14:21:09', duration: '0.9s' },
      { status: 'stale', name: 'dim_cost_centers', timestamp: '14:21:11', duration: '3.1s' },
      { status: 'needs-review', name: 'fct_ap_aging', timestamp: '14:21:14', duration: '6.7s' },
      { status: 'agent-working', name: 'fct_ar_aging', timestamp: '14:21:18' },
      { status: 'agent-proposed', name: 'fct_gl_entries_v2', timestamp: '14:21:22', duration: '5.0s' },
      { status: 'queued', name: 'dim_calendar', timestamp: '—' },
      { status: 'skipped', name: 'stg_sap__skat', timestamp: '—' },
    ];
    return (
      <Log>
        {entries.map((e) => (
          <RunLogRow key={e.name} {...e} />
        ))}
      </Log>
    );
  },
};

/** Expandable. A failed run is useless without its error. */
export const WithDetail: Story = {
  render: () => (
    <Log>
      <RunLogRow status="passed" name="stg_sap__bkpf" timestamp="14:21:02" duration="1.8s" />
      <RunLogRow
        status="failed"
        name="dim_accounts"
        timestamp="14:21:09"
        duration="0.9s"
        defaultOpen
        detail={`Database Error in model dim_accounts (models/marts/dim_accounts.sql)
  duplicate key value violates unique constraint "dim_accounts_pkey"
  DETAIL:  Key (account_id)=(4100-01) already exists.

  412 duplicate rows were written to the staging table before the run halted.`}
      />
      <RunLogRow
        status="needs-review"
        name="fct_ap_aging"
        timestamp="14:21:14"
        duration="6.7s"
        detail="Row count fell 18.4% against the trailing 7-day median. Threshold is 10%."
      />
      <RunLogRow status="passed" name="dim_calendar" timestamp="14:21:20" duration="0.4s" />
    </Log>
  ),
};

/** Grayscale — §10 requires every state to survive it. */
export const Grayscale: Story = {
  render: () => {
    const entries: { status: RunStatus; name: string }[] = [
      { status: 'passed', name: 'stg_sap__bkpf' },
      { status: 'running', name: 'int_fx_rates_daily' },
      { status: 'failed', name: 'dim_accounts' },
      { status: 'stale', name: 'dim_cost_centers' },
      { status: 'agent-proposed', name: 'fct_gl_entries_v2' },
      { status: 'queued', name: 'dim_calendar' },
    ];
    return (
      <div style={{ filter: 'grayscale(1)' }}>
        <Log>
          {entries.map((e) => (
            <RunLogRow key={e.name} {...e} timestamp="14:21:02" duration="1.8s" />
          ))}
        </Log>
      </div>
    );
  },
};
