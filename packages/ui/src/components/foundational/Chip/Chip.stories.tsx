import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { useState } from 'react';
import { FunnelIcon } from '@phosphor-icons/react';

import { Chip } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Chip',
  component: Chip,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { render: () => <Chip>SAP</Chip> };

/** Border and hover carry interactivity — not radius (§7.7). */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
      <Chip>Default</Chip>
      <Chip selected>Selected</Chip>
      <Chip disabled>Disabled</Chip>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
      <Chip size="sm">sm · Q2 FY2026</Chip>
      <Chip>default · Q2 FY2026</Chip>
    </div>
  ),
};

/**
 * Dismissible. The X is its own button, a sibling of the chip's, never inside
 * it: a button's content is presentational, so a control nested in one can
 * vanish for a screen reader (axe `nested-interactive`). Keyboard order is the
 * chip, then its X. Behaviour is covered in `tests/inline-controls.spec.ts`.
 */
export const Dismissible: Story = {
  render: function DismissibleStory() {
    const [chips, setChips] = useState(['SAP', 'Q2 FY2026', 'Kasane Europe', 'fct_gl_entries']);
    return (
      <div style={{ display: 'flex', gap: 'var(--gap-chip)', flexWrap: 'wrap', alignItems: 'center' }}>
        {chips.map((c) => (
          <Chip key={c} dismissLabel={`Remove ${c} filter`} onDismiss={() => setChips((s) => s.filter((x) => x !== c))}>
            {c}
          </Chip>
        ))}
        {chips.length === 0 ? (
          <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
            No filters
          </span>
        ) : null}
      </div>
    );
  },
  // Assertions only: a play that clicks or focuses would race the
  // screenshot taken on load (tests/visual.spec.ts).
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = canvas.getByRole('button', { name: 'SAP' });
    const dismiss = canvas.getByRole('button', { name: 'Remove SAP filter' });
    await expect(chip.contains(dismiss)).toBe(false);
    await expect(dismiss.parentElement).toBe(chip.parentElement);
  },
};

/** A filter bar — toggling selection, which is the interactive role (§4). */
export const FilterBar: Story = {
  render: function FilterBarStory() {
    const facets = ['Failed', 'Stale', 'Running', 'Agent-proposed'];
    const [active, setActive] = useState<string[]>(['Failed']);
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--gap-chip)',
          padding: 'var(--pad-popover)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
        }}
      >
        <FunnelIcon
          weight="bold"
          aria-hidden="true"
          className="text-text-secondary"
          style={{ width: 14, height: 14 }}
        />
        {facets.map((f) => (
          <Chip
            key={f}
            selected={active.includes(f)}
            onClick={() => setActive((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))}
          >
            {f}
          </Chip>
        ))}
      </div>
    );
  },
};
