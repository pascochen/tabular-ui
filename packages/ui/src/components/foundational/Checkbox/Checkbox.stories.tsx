import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Checkbox } from './index';

/**
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 */
const meta = {
  title: 'Foundational/Checkbox',
  component: Checkbox,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The label is the caller's job — a bare checkbox has no accessible name. */
const Labelled = ({
  id,
  children,
  ...props
}: { id: string; children: React.ReactNode } & React.ComponentProps<typeof Checkbox>) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-control-icon)' }}>
    <Checkbox id={id} {...props} />
    <label
      htmlFor={id}
      className="text-text-body"
      style={{ fontSize: 'var(--text-base)', lineHeight: 'var(--text-base--line-height)', cursor: 'default' }}
    >
      {children}
    </label>
  </div>
);

export const Default: Story = {
  render: () => (
    <Labelled id="cb-default" defaultChecked>
      Include upstream models
    </Labelled>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Labelled id="cb-off">Unchecked</Labelled>
      <Labelled id="cb-on" defaultChecked>
        Checked
      </Labelled>
      <Labelled id="cb-ind" indeterminate>
        Indeterminate — some rows selected
      </Labelled>
      <Labelled id="cb-dis" disabled>
        Disabled
      </Labelled>
      <Labelled id="cb-dis-on" disabled defaultChecked>
        Disabled, checked
      </Labelled>
      <Labelled id="cb-inv" aria-invalid>
        Invalid
      </Labelled>
    </div>
  ),
};

/** 14px beside 12px text, 16px beside 13px text. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-control-icon)' }}>
        <Checkbox id="cb-sm" size="sm" defaultChecked />
        <label htmlFor="cb-sm" className="text-text-body" style={{ fontSize: 'var(--text-sm)' }}>
          sm · 14px box
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-control-icon)' }}>
        <Checkbox id="cb-md" defaultChecked />
        <label htmlFor="cb-md" className="text-text-body" style={{ fontSize: 'var(--text-base)' }}>
          default · 16px box
        </label>
      </div>
    </div>
  ),
};

/**
 * The density case: row selection. `sm` in 28px rows, with a header checkbox
 * that goes indeterminate when the selection is partial.
 */
export const RowSelection: Story = {
  render: function RowSelectionStory() {
    const models = ['fct_gl_entries', 'dim_accounts', 'stg_sap__bkpf'];
    const [selected, setSelected] = useState<string[]>(['dim_accounts']);
    const all = selected.length === models.length;
    const some = selected.length > 0 && !all;

    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--pad-cell-x)',
            height: 'var(--h-row-sm)',
            padding: '0 var(--pad-cell-x)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Checkbox
            size="sm"
            aria-label="Select all models"
            checked={all}
            indeterminate={some}
            onCheckedChange={(checked) => setSelected(checked ? [...models] : [])}
          />
          <span
            className="text-text-secondary"
            style={{
              fontSize: 'var(--text-2xs)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            Model
          </span>
        </div>
        {models.map((m) => (
          <div
            key={m}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--pad-cell-x)',
              height: 'var(--h-row-sm)',
              padding: '0 var(--pad-cell-x)',
              background: selected.includes(m) ? 'var(--color-bg-interactive)' : undefined,
            }}
          >
            <Checkbox
              size="sm"
              aria-label={`Select ${m}`}
              checked={selected.includes(m)}
              onCheckedChange={(checked) => setSelected((s) => (checked ? [...s, m] : s.filter((x) => x !== m)))}
            />
            <span
              className="font-mono text-text-body"
              style={{
                fontSize: 'var(--text-xs)',
              }}
            >
              {m}
            </span>
          </div>
        ))}
      </div>
    );
  },
};
