import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './index';

/**
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 */
const meta = {
  title: 'Foundational/Input',
  component: Input,
  parameters: { layout: 'padded' },
  args: { placeholder: 'Search models…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)', width: 260 }}>
    <span
      className="text-text-secondary"
      style={{
        fontSize: 'var(--text-sm)',
        lineHeight: 'var(--text-sm--line-height)',
        fontWeight: 500,
      }}
    >
      {label}
    </span>
    {children}
    {hint ? (
      <span
        className="text-text-secondary"
        style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
      >
        {hint}
      </span>
    ) : null}
  </label>
);

export const Default: Story = {};

/**
 * The `content` prop. Note the figures: `numeric` aligns them on the decimal
 * with tabular-nums, which is the §8.6 requirement made structural.
 */
export const Content: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Field label="Description" hint="content=text · --font-sans, 13px">
        <Input defaultValue="Daily GL reconciliation" />
      </Field>
      <Field label="Opening balance" hint="content=numeric · tabular-nums, right-aligned">
        <Input content="numeric" defaultValue="1,284,102.00" />
      </Field>
      <Field label="Model" hint="content=mono · --font-mono one step down, slashed zero">
        <Input content="mono" defaultValue="fct_gl_entries_v2" />
      </Field>
    </div>
  ),
};

/**
 * Stacked numeric fields: the decimal points line up. Swap `content` to `text`
 * on any row and the column visibly breaks — that is the hazard §8.6 names.
 */
export const NumericAlignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)', width: 260 }}>
      {(
        [
          ['Opening balance', '1,284,102.00'],
          ['Accrued interest', '8,214.50'],
          ['Intercompany receivable', '412,880.75'],
          ['FX rounding', '11.09'],
        ] as const
      ).map(([name, v]) => (
        <Input key={v} content="numeric" defaultValue={v} aria-label={name} />
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Field label="sm · 24px">
        <Input size="sm" placeholder="Filter rows…" />
      </Field>
      <Field label="default · 32px">
        <Input placeholder="Search models…" />
      </Field>
      <Field label="lg · 36px">
        <Input size="lg" placeholder="Search models…" />
      </Field>
    </div>
  ),
};

/**
 * Invalid pairs the border tint with a danger-coloured message. The message is
 * not decoration — a border alone does not survive grayscale (§5, §10).
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Field label="Default">
        <Input placeholder="Search models…" />
      </Field>
      <Field label="With value">
        <Input defaultValue="fct_gl_entries" />
      </Field>
      <Field label="Disabled">
        <Input disabled defaultValue="Locked by AI" />
      </Field>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)', width: 260 }}>
        <span
          className="text-text-secondary"
          style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--text-sm--line-height)', fontWeight: 500 }}
        >
          Invalid
        </span>
        <Input aria-invalid content="numeric" defaultValue="-412.00" />
        <span
          className="text-text-danger"
          style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
        >
          Opening balance cannot be negative
        </span>
      </label>
    </div>
  ),
};

/** The dense case — `size="sm"` in a filter bar above a table. */
export const InFilterBar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-inline)',
        padding: 'var(--pad-popover)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        maxWidth: 560,
      }}
    >
      <Input size="sm" placeholder="Filter models…" content="mono" />
      <Input size="sm" placeholder="Min rows" content="numeric" style={{ width: 96 }} />
    </div>
  ),
};
