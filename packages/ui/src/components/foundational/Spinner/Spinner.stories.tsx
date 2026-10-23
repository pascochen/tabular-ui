import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Spinner } from './index';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { runStatuses, type RunStatus } from '../../product/StatusBadge/statuses';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Spinner',
  component: Spinner,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

const column: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--gap-group)' };

/** Beside its label, at the size and colour of the text: how it ships. */
export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-[var(--gap-control-icon)] text-sm text-text-secondary">
      <Spinner />
      <span>Working…</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('[data-slot="spinner"]');
    // Decorative: the label says what is working.
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    await expect(svg).not.toHaveAttribute('role');
    // Phosphor's bold on its 256 grid, in 16 units (§11.5).
    await expect(svg).toHaveAttribute('stroke-width', '1.5');
  },
};

/**
 * Large, to judge the corners and the gap. The mark is drawn in 16 units like
 * a Phosphor icon, so it scales with `font-size`.
 */
export const Large: Story = {
  render: () => (
    <span className="text-text-secondary" style={{ fontSize: 96, lineHeight: 1, display: 'flex' }}>
      <Spinner />
    </span>
  ),
};

/**
 * Every size it ships at: a 10px badge mark, `--size-icon-xs` in a plan's
 * number column, `--size-icon-sm` in a stage list, and `1em` beside
 * `--text-sm` and `--text-base`.
 */
export const Sizes: Story = {
  render: () => (
    <div style={column}>
      <div>
        <Badge tone="info">
          <Spinner />
          running
        </Badge>
      </div>
      <div className="flex items-center gap-[var(--gap-inline)] text-base text-text-secondary">
        <Spinner className="size-[var(--size-icon-xs)]" />
        <span>--size-icon-xs</span>
      </div>
      <div className="flex items-center gap-[var(--gap-inline)] text-base text-text-secondary">
        <Spinner className="size-[var(--size-icon-sm)]" />
        <span>--size-icon-sm</span>
      </div>
      <div className="flex items-center gap-[var(--gap-control-icon)] text-sm text-text-secondary">
        <Spinner />
        <span>1em at --text-sm</span>
      </div>
      <div className="flex items-center gap-[var(--gap-control-icon)] text-base text-text-secondary">
        <Spinner />
        <span>1em at --text-base</span>
      </div>
    </div>
  ),
};

/**
 * Stroke follows Phosphor's weight scale (§11.2). Inside a `Button` it takes
 * the button's `IconContext`: `bold`, and `light` when disabled.
 */
export const Weights: Story = {
  render: () => (
    <div style={column}>
      <div className="flex items-center gap-[var(--gap-group)] text-text-secondary" style={{ fontSize: 32 }}>
        <Spinner weight="thin" />
        <Spinner weight="light" />
        <Spinner weight="regular" />
        <Spinner weight="bold" />
      </div>
      <div className="flex gap-[var(--gap-inline)]">
        <Button variant="outline">
          <Spinner />
          Saving
        </Button>
        <Button variant="outline" disabled>
          <Spinner />
          Saving
        </Button>
      </div>
    </div>
  ),
};

/**
 * With no visible label, an `aria-label` makes it `role="status"`, so it is
 * announced. Prefer a visible label.
 */
export const Labelled: Story = {
  render: () => (
    <span className="text-text-secondary">
      <Spinner aria-label="Loading results" />
    </span>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('[data-slot="spinner"]');
    await expect(svg).toHaveAttribute('role', 'status');
    await expect(svg).not.toHaveAttribute('aria-hidden');
  },
};

const STATES = Object.keys(runStatuses) as RunStatus[];

/**
 * §10's grayscale gate, and what a reduced-motion user sees: the still
 * frame, among every other status mark. Each of those is a circle or a
 * figure, so the square stays distinct with the hue gone (right).
 * `running` and `agent working` share it; their labels tell them apart (§11.5).
 */
export const AmongStatuses: Story = {
  render: () => {
    const list = (
      <div style={column}>
        {STATES.map((s) => {
          const { icon: Icon, tone, label, working } = runStatuses[s];
          return (
            <div key={s}>
              <Badge tone={tone}>
                {working ? <Spinner /> : <Icon weight="bold" aria-hidden="true" />}
                {label}
              </Badge>
            </div>
          );
        })}
      </div>
    );
    return (
      <div style={{ display: 'flex', gap: 48 }}>
        {list}
        <div style={{ filter: 'grayscale(1)' }}>{list}</div>
      </div>
    );
  },
};
