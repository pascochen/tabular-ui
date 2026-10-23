import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { RobotIcon } from '@phosphor-icons/react';

import { Badge } from './index';
import { badgeVariants } from './variants';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Badge tone="success">passed</Badge> };

/** All seven grounds. The hue must be true of the thing the badge marks (§0 rule 1). */
export const Roles: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
      <Badge>queued</Badge>
      <Badge tone="info">running</Badge>
      <Badge tone="success">passed</Badge>
      <Badge tone="danger">failed</Badge>
      <Badge tone="warning">stale</Badge>
      <Badge tone="agent">proposed</Badge>
    </div>
  ),
};

/** Count badges are the one legitimate pill (§7.7). Figures are tabular. */
export const Counts: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
      <Badge shape="count">3</Badge>
      <Badge shape="count" tone="danger">
        12
      </Badge>
      <Badge shape="count" tone="agent">
        7
      </Badge>
    </div>
  ),
};

/** With a mark. Icons sit below the icon scale's floor here. */
export const WithIcon: Story = {
  render: () => (
    <Badge tone="agent">
      <RobotIcon weight="bold" aria-hidden="true" />
      generated
    </Badge>
  ),
};

/**
 * The reason §7.7 rejects pills for status: down a status column, square badges
 * form a clean vertical left edge. Compare the left margin of each badge.
 */
export const StatusColumn: Story = {
  render: () => {
    const rows: { model: string; status: string; tone: 'success' | 'danger' | 'warning' | 'info' | 'agent' }[] = [
      { model: 'fct_gl_entries', status: 'passed', tone: 'success' },
      { model: 'dim_accounts', status: 'failed', tone: 'danger' },
      { model: 'stg_sap__bkpf', status: 'running', tone: 'info' },
      { model: 'int_fx_rates_daily', status: 'stale', tone: 'warning' },
      { model: 'fct_ap_aging', status: 'proposed', tone: 'agent' },
    ];
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          maxWidth: 420,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.model}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--pad-cell-x)',
              height: 'var(--h-row-sm)',
              padding: '0 var(--pad-cell-x)',
              borderTop: i === 0 ? undefined : '1px solid var(--color-border)',
            }}
          >
            <span
              className="font-mono text-text-body"
              style={{
                flex: 1,
                fontSize: 'var(--text-xs)',
              }}
            >
              {r.model}
            </span>
            <Badge tone={r.tone}>{r.status}</Badge>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * `role` is the ARIA attribute: a badge whose change should be announced takes
 * `role="status"`. The colour is `tone`. Until 2026-10-09 the colour prop was
 * `role`, so a badge could never carry a real one.
 */
export const AriaRole: Story = {
  render: () => (
    <Badge tone="info" role="status">
      running
    </Badge>
  ),
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByRole('status');
    await expect(badge).toHaveTextContent('running');
    await expect(badge.className).toContain('text-text-info');
  },
};

/**
 * Test only, hidden from the sidebar and docs so nobody copies it: the
 * deprecated spelling keeps working while callers migrate. A tone name in
 * `role` sets the tone and never reaches the element as an ARIA role.
 */
export const DeprecatedRoleSpelling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div data-testid="legacy">
      {/* eslint-disable-next-line no-restricted-syntax -- exercising the deprecated spelling on purpose */}
      <Badge role="danger">failed</Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByTestId('legacy').firstElementChild!;
    await expect(badge).not.toHaveAttribute('role');
    await expect(badge.className).toContain('text-text-danger');
    await expect(badgeVariants({ role: 'danger' })).toContain('text-text-danger');
    await expect(badgeVariants({ role: 'danger', tone: 'info' })).toContain('text-text-info');
  },
};
