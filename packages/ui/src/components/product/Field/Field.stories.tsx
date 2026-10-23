import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Input } from '../../foundational/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../foundational/Select';
import { Field } from './index';
import { placeholderText } from '../../../fixtures/a11y-exceptions';

const meta = {
  title: 'Product/Field',
  component: Field,
  parameters: { layout: 'padded' },
  args: { label: 'Label', children: () => null },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="Model name" help="Lowercase, underscore-separated.">
        {(p) => <Input {...p} content="mono" placeholder="fct_gl_entries" />}
      </Field>
    </div>
  ),
};

/** Error replaces help rather than stacking — two messages is a reading-order problem. */
export const WithError: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Field
        label="Model name"
        required
        help="Lowercase, underscore-separated."
        error="A model named fct_gl_entries already exists."
      >
        {(p) => <Input {...p} content="mono" defaultValue="fct_gl_entries" />}
      </Field>
    </div>
  ),
  // The asterisk is aria-hidden, so the control's own attributes are the only
  // place "required" reaches AT. This shipped missing once — see CLAUDE.md.
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('textbox', { name: 'Model name' });
    await expect(input).toBeRequired();
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription('A model named fct_gl_entries already exists.');
  },
};

/** The render prop exists so the control cannot be left unwired. */
export const WithSelect: Story = {
  parameters: placeholderText,
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="Materialization" required help="How dbt persists this model.">
        {(p) => (
          <Select>
            {/* A trigger is a button: it takes aria-required, not required. */}
            <SelectTrigger id={p.id} aria-describedby={p['aria-describedby']} aria-required={p['aria-required']}>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">view</SelectItem>
              <SelectItem value="table">table</SelectItem>
              <SelectItem value="incremental">incremental</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Field>
    </div>
  ),
};

export const FormStack: Story = {
  render: () => (
    <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Field label="Model name" required>
        {(p) => <Input {...p} content="mono" defaultValue="fct_ap_aging" />}
      </Field>
      <Field label="Schema" required>
        {(p) => <Input {...p} content="mono" defaultValue="analytics_marts" />}
      </Field>
      <Field label="Owner" help="Notified when this model fails.">
        {(p) => <Input {...p} defaultValue="a.kanzaki" />}
      </Field>
    </div>
  ),
};
