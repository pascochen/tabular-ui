import type { Meta, StoryObj } from '@storybook/react-vite';

import { money, percentChange } from '../../../fixtures/format';
import { balance, h1 } from '../../../fixtures/kasane';
import { MetricTile } from './index';

// Kasane's first half of FY2026, against the same half a year earlier and against budget.
const netSales = money(h1.netSales.actual);
const salesVsPriorYear = percentChange(h1.netSales.actual, h1.netSales.priorYear);
const salesDelta = Number(salesVsPriorYear.replace('%', ''));
const sga = money(-h1.sga.actual);
const sgaVsPriorYear = percentChange(h1.sga.actual, h1.sga.priorYear);
const opVsBudget = percentChange(h1.operatingProfit.actual, h1.operatingProfit.budget);
const renewalDelta = Math.round((balance.contractRenewalPct - balance.contractRenewalPctFyStart) * 10) / 10;
const priorYear = 'vs. H1 FY2025';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/MetricTile',
  component: MetricTile,
  parameters: { layout: 'padded' },
  args: { label: 'Net sales', value: netSales },
} satisfies Meta<typeof MetricTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { delta: salesVsPriorYear, deltaValue: salesDelta, caption: priorYear },
};

/**
 * The reason `higherIsBetter` exists. Both tiles moved up on last year.
 * Sales up is good; SG&A up is not. Direction and goodness are different things.
 */
export const PolarityIsNotDirection: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 220px)', gap: 'var(--gap-group)' }}>
      <MetricTile
        label="Net sales"
        value={netSales}
        delta={salesVsPriorYear}
        deltaValue={salesDelta}
        caption={priorYear}
      />
      <MetricTile
        label="SG&A"
        value={sga}
        delta={sgaVsPriorYear}
        deltaValue={Number(sgaVsPriorYear.replace('%', ''))}
        higherIsBetter={false}
        caption={priorYear}
      />
    </div>
  ),
};

/** Zero is neutral, never a hue (§5). */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 200px)', gap: 'var(--gap-group)' }}>
      <MetricTile label="Net sales" value={netSales} delta={salesVsPriorYear} deltaValue={salesDelta} />
      <MetricTile
        label="Operating profit"
        value={money(h1.operatingProfit.actual)}
        delta={opVsBudget}
        deltaValue={Number(opVsBudget.replace('%', ''))}
      />
      <MetricTile
        label="Contract renewal"
        value={`${balance.contractRenewalPct.toFixed(1)}%`}
        delta={`${renewalDelta >= 0 ? '+' : '-'}${Math.abs(renewalDelta).toFixed(1)}pt`}
        deltaValue={renewalDelta}
      />
    </div>
  ),
};

/** Both display tiers — 32px hero and 24px in a grid of four. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-section)' }}>
      <div style={{ width: 260 }}>
        <MetricTile
          label="Primary KPI · 32px"
          value={netSales}
          delta={salesVsPriorYear}
          deltaValue={salesDelta}
          caption={priorYear}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-group)' }}>
        <MetricTile size="sm" label="Models" value="1,284" delta="+12" deltaValue={12} />
        <MetricTile size="sm" label="Failed" value="3" delta="+2" deltaValue={2} higherIsBetter={false} />
        <MetricTile
          size="sm"
          label="Avg duration"
          value="4.2s"
          delta="-0.8s"
          deltaValue={-0.8}
          higherIsBetter={false}
        />
        <MetricTile size="sm" label="Coverage" value="94.1%" delta="+1.4%" deltaValue={1.4} />
      </div>
    </div>
  ),
};

/** No delta — a figure with nothing to compare against stays quiet. */
export const NoDelta: Story = { args: { caption: '12 models' } };
