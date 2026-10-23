import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '../../foundational/Button';
import { AppShellPanelFooter, AppShellPanelHeader } from '../AppShell';
import { ChatThread, type ChatTurn } from '../ChatThread';
import { ChatComposer, type ChatAttachment, type ChatComposerHandle } from './index';

const meta = {
  title: 'Product/ChatComposer',
  component: ChatComposer,
  parameters: { layout: 'padded' },
  args: { onSend: fn() },
  // The panel's footer, 440px wide on the panel surface.
  render: (args) => (
    <div className="w-[var(--w-panel)] border-x border-border bg-surface">
      <AppShellPanelFooter>
        <ChatComposer {...args} />
      </AppShellPanelFooter>
    </div>
  ),
} satisfies Meta<typeof ChatComposer>;
export default meta;
type Story = StoryObj<typeof meta>;

const rect = (el: Element) => el.getBoundingClientRect();
const px = (el: Element, property: string) => parseFloat(getComputedStyle(el).getPropertyValue(property));

/**
 * One box, two rows: the message on top, Send at the bottom right, inside the
 * box. Enter sends; Shift+Enter is a new line.
 */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const send = canvas.getByRole('button', { name: 'Send' });
    const box = canvasElement.querySelector('[data-slot="chat-composer"]')!;

    // Send sits inside the box, at its bottom-right corner, inset by the box's padding.
    const inset = px(box, '--pad-card') + 1; // + the 1px border
    await expect(rect(box).right - rect(send).right).toBe(inset);
    await expect(rect(box).bottom - rect(send).bottom).toBe(inset);
    // The message row is one line tall, above Send.
    await expect(rect(field).height).toBe(px(field, 'line-height'));
    // Empty, the box is padding + one line + the row gap + Send + padding +
    // borders: 86px, derived from the tokens rather than restated.
    await expect(rect(box).height).toBe(
      2 * px(box, '--pad-card') + px(field, 'line-height') + px(box, '--gap-field') + px(box, '--h-control') + 2,
    );
    await expect(rect(box).height).toBe(86);
    await expect(rect(field).bottom).toBeLessThan(rect(send).top);

    // --radius-md, as every control since 2026-10-15 (§7.7).
    await expect(parseFloat(getComputedStyle(send).borderTopLeftRadius)).toBe(px(send, '--radius-md'));

    // Nothing to send yet, and blank space is not a message.
    await expect(send).toBeDisabled();
    await userEvent.type(field, '   {Enter}');
    await expect(args.onSend).not.toHaveBeenCalled();
    await expect(send).toBeDisabled();

    // Shift+Enter is a new line; Enter sends the trimmed text and clears.
    // Last, so the story ends on an empty field: ending on leftover spaces
    // rendered 2px differently between CI runs and failed the screenshot.
    await userEvent.type(field, 'Which models read order_total?{Shift>}{Enter}{/Shift}Only the marts.  ');
    await expect(args.onSend).not.toHaveBeenCalled();
    await expect(send).toBeEnabled();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSend).toHaveBeenCalledTimes(1);
    await expect(args.onSend).toHaveBeenCalledWith('Which models read order_total?\nOnly the marts.');
    await expect(field).toHaveValue('');
    await expect(field).toHaveFocus();
  },
};

/** The whole box is the place to type: a press on its padding puts the caret in the field. */
export const PressAnywhere: Story = {
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[data-slot="chat-composer"]')!;
    const field = within(canvasElement).getByRole('textbox', { name: 'Message' });
    const { left, top } = rect(box);
    // Top-left corner of the box's padding, outside the field.
    await userEvent.pointer({ keys: '[MouseLeft]', target: box, coords: { clientX: left + 4, clientY: top + 4 } });
    await expect(field).toHaveFocus();
    // The field draws no ring (borderless); the box does, and it paints. The
    // failure log has a ring whose width and colour were right while its
    // style resolved to none.
    const ring = getComputedStyle(box);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(parseFloat(ring.outlineWidth)).toBe(px(box, '--ring-width'));
    await expect(getComputedStyle(field).outlineStyle).toBe('none');
  },
};

/** Clicking Send keeps the user in the field, though Send disables itself once it empties. */
export const ClickToSend: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    await userEvent.type(field, 'Rebuild the revenue model');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSend).toHaveBeenCalledWith('Rebuild the revenue model');
    await expect(field).toHaveFocus();
  },
};

/**
 * A long message grows the box upward to six lines, then the text scrolls.
 * Send stays at the bottom right, and the hidden lines fade at the edge
 * instead of being cut through.
 */
export const LongMessage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const send = canvas.getByRole('button', { name: 'Send' });
    const box = canvasElement.querySelector('[data-slot="chat-composer"]')!;
    const lineHeight = px(field, 'line-height');
    const sendFromBottom = rect(box).bottom - rect(send).bottom;

    const lines = [
      'fct_revenue',
      'mart_revenue_monthly',
      'stg_sap__bkpf',
      'stg_sap__bseg',
      'dim_accounts',
      'fct_ap_aging',
    ];
    await userEvent.type(field, `Check these models:${lines.map((l) => `{Shift>}{Enter}{/Shift}${l}`).join('')}`);
    await expect(rect(field).height).toBe(6 * lineHeight);
    await expect(field.scrollHeight).toBeGreaterThan(field.clientHeight);
    // Hidden lines fade at the edge they hide behind. Scrolled to the end,
    // that's the top. (Synthetic typing doesn't scroll to the caret, so the
    // test scrolls; a real keyboard does it by itself.)
    field.scrollTop = field.scrollHeight;
    await waitFor(() => expect(field).toHaveAttribute('data-overflow-y-start'));
    await expect(field).not.toHaveAttribute('data-overflow-y-end');
    // Send didn't move relative to the box.
    await expect(rect(box).bottom - rect(send).bottom).toBe(sendFromBottom);
  },
};

const longFill = Array.from({ length: 8 }, (_, i) => `Line ${i + 1} of a long question`).join('\n');

/**
 * `ref.fill(text)` replaces the draft and leaves the caret at the end, for a
 * suggestion the user picked (`ChatStarter`). It never sends. A fill longer
 * than `maxRows` scrolls to the end, where the caret is.
 */
export const Fill: Story = {
  render: function Render(args) {
    const composer = useRef<ChatComposerHandle>(null);
    return (
      <div className="flex w-[var(--w-panel)] flex-col gap-[var(--gap-field)]">
        <Button variant="outline" className="self-start" onClick={() => composer.current?.fill(longFill)}>
          Fill
        </Button>
        <div className="border-x border-border bg-surface">
          <AppShellPanelFooter>
            <ChatComposer {...args} ref={composer} />
          </AppShellPanelFooter>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole<HTMLTextAreaElement>('textbox', { name: 'Message' });
    await userEvent.type(field, 'a draft');
    await userEvent.click(canvas.getByRole('button', { name: 'Fill' }));
    await expect(field).toHaveValue(longFill);
    await expect(field).toHaveFocus();
    await expect(field.selectionStart).toBe(longFill.length);
    await expect(args.onSend).not.toHaveBeenCalled();
    await waitFor(() => expect(field).toHaveAttribute('data-overflow-y-start'));
    await expect(field).not.toHaveAttribute('data-overflow-y-end');
    // Clear it, so the story ends still and on an empty field (failure log).
    await userEvent.clear(field);
  },
};

/**
 * `onAttach` shows the paperclip, first in the bottom row. Picked files list
 * in the box above the message, each with a remove button. A message can be
 * the files alone.
 */
export const Attach: Story = {
  render: function Render(args) {
    const [files, setFiles] = useState<ChatAttachment[]>([]);
    return (
      <div className="w-[var(--w-panel)] border-x border-border bg-surface">
        <AppShellPanelFooter>
          <ChatComposer
            {...args}
            attachments={files}
            onAttach={(picked) =>
              setFiles((current) => [
                ...current,
                ...picked.map((file) => ({ id: file.name, name: file.name, size: '12 KB' })),
              ])
            }
            onRemoveAttachment={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
            onSend={(text) => {
              args.onSend(text);
              setFiles([]);
            }}
          />
        </AppShellPanelFooter>
      </div>
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const attach = canvas.getByRole('button', { name: 'Attach file' });
    const send = canvas.getByRole('button', { name: 'Send' });
    const box = canvasElement.querySelector('[data-slot="chat-composer"]')!;

    // Bottom left, inset by the box's padding, level with Send.
    const inset = px(box, '--pad-card') + 1;
    await expect(rect(attach).left - rect(box).left).toBe(inset);
    await expect(rect(attach).top).toBe(rect(send).top);

    // The picker offers what the agent reads, and is not a second control.
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    await expect(input.accept).toBe('.md,.csv,.xlsx,.xls,.txt');
    await expect(input).toHaveAttribute('aria-hidden', 'true');
    await expect(input.tabIndex).toBe(-1);

    await userEvent.upload(input, [
      new File(['a,b'], 'journal_entries_2026-09.csv', { type: 'text/csv' }),
      new File(['# notes'], 'close_memo_2026-09.md', { type: 'text/markdown' }),
    ]);
    const list = canvas.getByRole('list', { name: 'Attached files' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // Files alone are a message.
    await expect(send).toBeEnabled();
    // Each file's glyph lines up with the message text.
    const glyph = list.querySelector('svg')!;
    await expect(rect(glyph).left).toBe(rect(field).left);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove close_memo_2026-09.md' }));
    await expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    await expect(field).toHaveFocus();

    await userEvent.type(field, 'Does this reconcile with fct_gl_entries?{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith('Does this reconcile with fct_gl_entries?');
    await expect(canvas.queryByRole('list', { name: 'Attached files' })).toBeNull();
    await expect(field).toHaveValue('');
  },
};

/** A file still uploading holds the message: it can't go out referring to a file the agent doesn't have yet. */
export const Uploading: Story = {
  args: {
    value: 'Compare with August',
    onAttach: fn(),
    onRemoveAttachment: fn(),
    attachments: [
      // Uploaded: no status. A green "Passed" here reads as a validation result.
      { id: '1', name: 'journal_entries_2026-09.csv', size: '2.4 MB' },
      { id: '2', name: 'ap_aging_2026-09.xlsx', status: 'running', progress: 60 },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled();
    await expect(canvas.getByRole('progressbar', { name: 'Uploading ap_aging_2026-09.xlsx' })).toBeVisible();
  },
};

/** A failed file holds the message too, until it's removed. */
export const FailedFile: Story = {
  render: function Render(args) {
    const [files, setFiles] = useState<ChatAttachment[]>([
      { id: '1', name: 'trial_balance_kjp_2026-09.pdf', size: '880 KB', status: 'failed' },
    ]);
    return (
      <div className="w-[var(--w-panel)] border-x border-border bg-surface">
        <AppShellPanelFooter>
          <ChatComposer
            {...args}
            value="What changed in the trial balance?"
            onAttach={() => {}}
            attachments={files}
            onRemoveAttachment={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
          />
        </AppShellPanelFooter>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = canvas.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove trial_balance_kjp_2026-09.pdf' }));
    await expect(send).toBeEnabled();
  },
};

/** A turn is streaming, with `onStop`: Send becomes Stop. Typing still works. */
export const Busy: Story = {
  args: { busy: true, onStop: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    await expect(canvas.queryByRole('button', { name: 'Send' })).toBeNull();

    await userEvent.type(field, 'And the tax column?{Enter}');
    await expect(args.onSend).not.toHaveBeenCalled();
    await expect(field).toHaveValue('And the tax column?');

    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
    await expect(field).toHaveFocus();
  },
};

/** Streaming with no `onStop`: nothing can stop the turn, so Send stays, disabled. */
export const BusyWithoutStop: Story = {
  args: { busy: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Send' })).toBeDisabled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled();
  },
};

/**
 * The chat panel end to end: send a question, and the thread shows it with
 * "Working…" beneath. Nothing answers here; the turn stays waiting.
 */
export const InPanel: Story = {
  render: function Render() {
    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const busy = turns.length > 0;
    return (
      <div className="flex w-[var(--w-panel)] flex-col border-x border-border bg-surface" style={{ height: 480 }}>
        <AppShellPanelHeader title="Chat" />
        <ChatThread turns={turns} busy={busy} />
        <AppShellPanelFooter>
          <ChatComposer
            busy={busy}
            onStop={() => setTurns([])}
            onSend={(text) =>
              setTurns((t) => [
                ...t,
                { id: `q-${t.length}`, role: 'user', text },
                { id: `a-${t.length}`, role: 'assistant' },
              ])
            }
          />
        </AppShellPanelFooter>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Message' }),
      'Why is H1 operating profit under budget?{Enter}',
    );
    await expect(canvas.getByText('Why is H1 operating profit under budget?')).toBeVisible();
    await expect(canvas.getByText('Working…')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Stop' })).toBeVisible();
  },
};
