import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { AppShellPanelFooter, AppShellPanelHeader } from '../AppShell';
import { ChatComposer, type ChatComposerHandle } from '../ChatComposer';
import { ChatThread, type ChatTurn } from '../ChatThread';
import { ChatStarter } from './index';

/** Promises only what the agent does today: answer and explain, not change. */
const description =
  'Ask about your models, runs and figures, why a run or test failed, or a file you attach. Nothing here changes your data.';

/** For a run-log screen. Each screen passes its own. */
const runSuggestions = [
  'Why did dim_accounts fail its last run?',
  'Which runs failed in the last 24 hours?',
  'Which models read order_total?',
  'Is stg_sap__bseg fresh enough for close?',
];

const meta = {
  title: 'Product/ChatStarter',
  component: ChatStarter,
  parameters: { layout: 'padded' },
  args: { description, suggestions: runSuggestions, onSelect: fn() },
} satisfies Meta<typeof ChatStarter>;
export default meta;
type Story = StoryObj<typeof meta>;

const rect = (el: Element) => el.getBoundingClientRect();

/**
 * The chat panel wired as a screen would: the starter in ChatThread's
 * `empty` slot while the thread is empty and the draft is too. A pick fills
 * the composer; Enter sends it.
 */
function Panel({ suggestions, height = 560 }: { suggestions: string[]; height?: number }) {
  const composer = useRef<ChatComposerHandle>(null);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  return (
    <div className="flex w-[var(--w-panel)] flex-col border-x border-border bg-surface" style={{ height }}>
      <AppShellPanelHeader title="Chat" />
      <ChatThread
        turns={turns}
        busy={turns.length > 0}
        // Hidden once there's a draft: a pick replaces the draft, so a
        // visible list could wipe what the user typed.
        empty={
          draft === '' ? (
            <ChatStarter
              description={description}
              suggestions={suggestions}
              onSelect={(text) => composer.current?.fill(text)}
            />
          ) : null
        }
      />
      <AppShellPanelFooter>
        <ChatComposer
          ref={composer}
          value={draft}
          onValueChange={setDraft}
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
}

/**
 * The empty panel: the scope line and four questions, at the bottom against
 * the composer. Picking one fills the box with the caret at the end, and
 * sends nothing; the list steps aside while there's a draft and comes back
 * when it's cleared.
 */
export const InPanel: Story = {
  render: (args) => <Panel suggestions={args.suggestions} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message' });
    const list = canvas.getByRole('list', { name: 'Suggested' });
    const footer = canvasElement.querySelector('[data-slot="app-shell-panel-footer"]')!;
    const starter = canvasElement.querySelector('[data-slot="chat-starter"]')!;

    await expect(canvas.getByText(description)).toBeVisible();
    await expect(within(list).getAllByRole('button')).toHaveLength(4);
    // Against the composer: one --pad-page-y above the footer rule.
    const padY = parseFloat(getComputedStyle(starter).getPropertyValue('--pad-page-y'));
    await expect(rect(footer).top - rect(starter).bottom).toBe(padY);
    // Rows line up with the composer's box: same left and right edges.
    const box = canvasElement.querySelector('[data-slot="chat-composer"]')!;
    const row = within(list).getAllByRole('button')[0];
    await expect(rect(row).left).toBe(rect(box).left);
    await expect(rect(row).right).toBe(rect(box).right);
    // Regular weight: Button's 500 made the rows louder than the composer.
    await expect(getComputedStyle(row).fontWeight).toBe('400');

    // A draft hides the list, so a pick can't wipe it; clearing brings it
    // back. Here, not in a story of its own: a story that ended on the list
    // just reappearing beside a focused composer rendered their left corners
    // one colour step apart between runs (1 in 4 locally, and on CI).
    await userEvent.type(field, 'Wh');
    await expect(canvas.queryByRole('list', { name: 'Suggested' })).toBeNull();
    await userEvent.clear(field);
    await expect(canvas.getByRole('list', { name: 'Suggested' })).toBeVisible();
    await expect(field).toHaveFocus();

    const pick = 'Which models read order_total?';
    await userEvent.click(canvas.getByRole('button', { name: pick }));
    await expect(field).toHaveValue(pick);
    await expect(field).toHaveFocus();
    await expect((field as HTMLTextAreaElement).selectionStart).toBe(pick.length);
    // Filled, not sent: no turn in the thread.
    await expect(canvas.queryByText('Working…')).toBeNull();
    await expect(canvas.queryByRole('list', { name: 'Suggested' })).toBeNull();

    // The user names the scope, then sends.
    await userEvent.type(field, ' Only the marts.{Enter}');
    await expect(canvas.getByText('Which models read order_total? Only the marts.')).toBeVisible();
    await expect(canvas.getByText('Working…')).toBeVisible();
    await expect(canvas.queryByRole('list', { name: 'Suggested' })).toBeNull();
  },
};

/**
 * A question longer than the row truncates, with the whole question in a
 * tooltip and in the button's name. Keep them to about 50 characters.
 */
export const LongQuestion: Story = {
  args: {
    suggestions: [
      'Why did fct_gl_entries take four times longer than usual on its last scheduled run?',
      'Which models read order_total?',
    ],
  },
  render: (args) => <Panel suggestions={args.suggestions} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: args.suggestions[0] });
    const text = row.querySelector('[data-slot="truncated-text"]')!;
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    // The row stays inside the panel.
    const box = canvasElement.querySelector('[data-slot="chat-composer"]')!;
    await expect(rect(row).right).toBe(rect(box).right);
  },
};

/**
 * A panel too short for the starter: it scrolls on its own, and its first
 * line can still be scrolled to (an overflowing `justify-end` column would
 * push it out of reach).
 */
export const ShortPanel: Story = {
  render: (args) => <Panel suggestions={args.suggestions} height={300} />,
  play: async ({ canvasElement }) => {
    const region = canvasElement.querySelector<HTMLElement>('[data-slot="chat-thread"]')!;
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    region.scrollTop = 0;
    const line = within(canvasElement).getByText(description);
    await waitFor(() => expect(rect(line).top).toBeGreaterThanOrEqual(rect(region).top));
  },
};

/** On its own, outside the panel. */
export const Standalone: Story = {
  render: (args) => (
    <div className="w-[var(--w-panel)] bg-surface p-[var(--pad-page-x)]">
      <ChatStarter {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: runSuggestions[0] }));
    await expect(args.onSelect).toHaveBeenCalledWith(runSuggestions[0]);
  },
};
