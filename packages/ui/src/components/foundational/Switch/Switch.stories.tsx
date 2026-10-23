import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './index';

/**
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 */
const meta = {
  title: 'Foundational/Switch',
  component: Switch,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

const Labelled = ({
  id,
  children,
  hint,
  ...props
}: { id: string; children: React.ReactNode; hint?: string } & React.ComponentProps<typeof Switch>) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-inline)', maxWidth: 380 }}>
    <Switch id={id} {...props} style={{ marginTop: 2 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-bonded)' }}>
      <label
        htmlFor={id}
        className="text-text-body"
        style={{ fontSize: 'var(--text-base)', lineHeight: 'var(--text-base--line-height)', cursor: 'default' }}
      >
        {children}
      </label>
      {hint ? (
        <span
          className="text-text-secondary"
          style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  </div>
);

export const Default: Story = {
  render: () => (
    <Labelled id="sw-default" defaultChecked hint="Applies as soon as it is flipped.">
      Auto-retry
    </Labelled>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Labelled id="sw-off">Off</Labelled>
      <Labelled id="sw-on" defaultChecked>
        On
      </Labelled>
      <Labelled id="sw-dis" disabled>
        Disabled, off
      </Labelled>
      <Labelled id="sw-dis-on" disabled defaultChecked>
        Disabled, on
      </Labelled>
    </div>
  ),
};

/** Track 24×14 with a 10px thumb, and 28×16 with a 12px thumb. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
        <Switch id="sw-sm-off" aria-label="Small, off" size="sm" />
        <Switch id="sw-sm-on" aria-label="Small, on" size="sm" defaultChecked />
        <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
          sm · 24×14, thumb 10
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
        <Switch id="sw-md-off" aria-label="Default, off" />
        <Switch id="sw-md-on" aria-label="Default, on" defaultChecked />
        <span className="text-text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
          default · 28×16, thumb 12
        </span>
      </div>
    </div>
  ),
};

/**
 * A settings panel — the shape a switch actually appears in. Each row applies
 * immediately; anything that needs a Save button wants a Checkbox instead.
 */
export const SettingsPanel: Story = {
  render: () => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--pad-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-group)',
        maxWidth: 420,
      }}
    >
      <Labelled id="sw-p1" defaultChecked hint="Re-runs failed models without asking.">
        Auto-retry
      </Labelled>
      <Labelled id="sw-p2" hint="Pauses the pipeline when a test fails.">
        Halt on test failure
      </Labelled>
      <Labelled id="sw-p3" defaultChecked hint="Sends a digest at 07:00 each weekday.">
        Daily summary
      </Labelled>
    </div>
  ),
};
