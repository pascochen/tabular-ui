import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Field } from '../../product/Field';
import { Input } from '../Input';
import { Textarea } from './index';

/**
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 */
const meta = {
  title: 'Foundational/Textarea',
  component: Textarea,
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Notes', placeholder: 'Add a note for the reviewer' },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

const height = (el: HTMLElement) => el.getBoundingClientRect().height;

/** Three lines when empty, growing with its text. */
export const Default: Story = {};

/** In a form, labelled by `Field`, beside an `Input` of the same width, border and type. */
export const InField: Story = {
  render: () => (
    <div className="flex flex-col gap-[var(--gap-field)]">
      <Field label="Run name">{(p) => <Input {...p} defaultValue="Daily GL reconciliation" />}</Field>
      <Field label="Reviewer note" help="Shown on the run log beside the approval.">
        {(p) => (
          <Textarea
            {...p}
            defaultValue={
              'Reconciled against the August close.\nThe 412 duplicate rows in dim_accounts came from the SAP delta load and are excluded.'
            }
          />
        )}
      </Field>
    </div>
  ),
};

/** `aria-invalid` from `Field` tints the border; the message is the half that survives grayscale (§5). */
export const Invalid: Story = {
  render: () => (
    <Field label="Reviewer note" required error="A note is required to approve a failed run.">
      {(p) => <Textarea {...p} />}
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: /Reviewer note/ });
    await expect(field).toBeRequired();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked while the run is in review.' },
};

/**
 * `minRows={1}`: one line is exactly `--h-control`, so it lines up with an
 * `Input` and a 32px button. Each new line adds one line-height until
 * `maxRows`, then it scrolls. This is the chat composer's setting.
 */
export const Growing: Story = {
  args: { minRows: 1, maxRows: 4, placeholder: 'Message' },
  render: (args) => (
    <div className="flex items-end gap-[var(--gap-inline)]">
      <Textarea {...args} />
      <Input aria-label="Comparison" defaultValue="32px" className="w-16" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Notes' });
    const input = canvas.getByRole('textbox', { name: 'Comparison' });
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight);

    // One line: the same box as Input, read from the token, not restated.
    const control = parseFloat(getComputedStyle(field).getPropertyValue('--h-control'));
    await expect(height(field)).toBe(control);
    await expect(height(field)).toBe(height(input));

    await userEvent.type(field, 'one{Shift>}{Enter}{/Shift}two{Shift>}{Enter}{/Shift}three');
    await expect(height(field)).toBe(control + 2 * lineHeight);

    // Past maxRows (4) it stops growing and scrolls.
    await userEvent.type(field, '{Shift>}{Enter}{/Shift}four{Shift>}{Enter}{/Shift}five{Shift>}{Enter}{/Shift}six');
    await expect(height(field)).toBe(control + 3 * lineHeight);
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);
  },
};

/**
 * `variant="borderless"`: a field inside a container that draws the box. No
 * border, padding, ring or disabled fade of its own, so here the wrapper draws
 * the border and the ring (`has-[textarea:focus-visible]`). Lines hidden by
 * scrolling fade at the edge instead of being cut through (§4 scroll cue).
 */
export const Borderless: Story = {
  args: { variant: 'borderless', minRows: 1, maxRows: 3, placeholder: 'Message' },
  render: (args) => (
    <div className="rounded-lg border border-border p-[var(--pad-card)] has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-[length:var(--ring-width)] has-[textarea:focus-visible]:outline-offset-[length:var(--ring-offset)] has-[textarea:focus-visible]:outline-ring">
      <Textarea {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByRole('textbox', { name: 'Notes' });
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight);
    await expect(height(field)).toBe(lineHeight);

    await userEvent.type(
      field,
      'one{Shift>}{Enter}{/Shift}two{Shift>}{Enter}{/Shift}three{Shift>}{Enter}{/Shift}four{Shift>}{Enter}{/Shift}five',
    );
    await expect(height(field)).toBe(3 * lineHeight);
    // At the top, the hidden lines are below: the bottom edge fades. (The
    // test's synthetic typing never scrolls to the caret; a real keyboard does.)
    await expect(field).toHaveAttribute('data-overflow-y-end');
    await expect(field).not.toHaveAttribute('data-overflow-y-start');
    // The attribute paints: a mask, not just a marker.
    await expect(getComputedStyle(field).maskImage).toContain('linear-gradient');

    // Scrolled to the end, the hidden lines are above: the top edge fades.
    field.scrollTop = field.scrollHeight;
    await waitFor(() => expect(field).toHaveAttribute('data-overflow-y-start'));
    await expect(field).not.toHaveAttribute('data-overflow-y-end');
  },
};
