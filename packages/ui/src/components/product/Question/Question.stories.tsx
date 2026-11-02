import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { Question, type QuestionAnswer } from './index';

const entities = [
  { id: 'all', label: 'All entities' },
  { id: 'kjp', label: 'KJP only' },
];

const answered = 'Answered by you: KJP only.';

/**
 * Question is a part of an AgentBlock, so every story renders it inside one,
 * at the chat panel's width (--w-panel) on the panel's ground. A story sets
 * the block's label with `parameters.authorship`.
 */
const meta = {
  title: 'Product/Question',
  component: Question,
  parameters: { layout: 'padded', authorship: 'AI · Awaiting your answer' },
  args: {
    title: 'Which entities should the variance cover: all of them, or KJP only?',
    options: entities,
    onAnswer: fn(),
  },
  decorators: [
    (Story, { parameters }) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship={parameters.authorship as string}>
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof Question>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two options, each a button: one press answers. Skip and Choose for me are
 * always there, ghost, at the trailing edge. No field, so no Answer button.
 */
export const Waiting: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: /Which entities/ });
    await expect(
      within(group)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All entities', 'KJP only']);
    await expect(canvas.getByRole('button', { name: 'Skip' })).toBeEnabled();
    await expect(canvas.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
    await expect(canvas.queryByRole('button', { name: 'Answer' })).toBeNull();
    // Not a radio group: nothing is selected, and nothing waits to be sent.
    await expect(canvas.queryByRole('radio')).toBeNull();
  },
};

/**
 * What each answer does, beside its button, when the label alone can't say it.
 * The button is described by its line, so a screen reader hears both.
 */
export const Described: Story = {
  args: {
    title: 'September is locked. Where should the correction go?',
    options: [
      {
        id: 'reopen',
        label: 'Reopen September',
        description: 'Reverse the invoice in September and rebook it on 2 Oct. H1 is right for the earnings release.',
      },
      {
        id: 'keep-locked',
        label: 'Keep September locked',
        description: 'Post nothing. List the amount for the auditors’ interim review.',
      },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const reopen = canvas.getByRole('button', { name: 'Reopen September' });
    const keep = canvas.getByRole('button', { name: 'Keep September locked' });
    await expect(reopen).toHaveAccessibleDescription(/^Reverse the invoice/);
    await expect(keep).toHaveAccessibleDescription(/^Post nothing/);
    // One column of buttons, one of lines, whatever each label's length.
    await expect(reopen.getBoundingClientRect().width).toBe(keep.getBoundingClientRect().width);
    await expect(canvas.getByText(/^Post nothing/).getBoundingClientRect().left).toBeGreaterThan(
      keep.getBoundingClientRect().right,
    );
    await userEvent.click(keep);
    await expect(args.onAnswer).toHaveBeenCalledWith({ kind: 'option', id: 'keep-locked' });
  },
};

/**
 * Under 320px, each line goes under its button. Beside it, in the 215px the
 * demo's thread has on a 375px phone, the line got 69px and ran to ten lines.
 */
export const DescribedNarrow: Story = {
  args: Described.args,
  render: (args) => (
    <div className="w-[215px]">
      <Question {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = [
      [canvas.getByRole('button', { name: 'Reopen September' }), canvas.getByText(/^Reverse the invoice/)],
      [canvas.getByRole('button', { name: 'Keep September locked' }), canvas.getByText(/^Post nothing/)],
    ].map(([button, line]) => ({ button: button.getBoundingClientRect(), line: line.getBoundingClientRect() }));
    for (const { button, line } of rows) {
      // The whole width, and bonded to its own button.
      await expect(button.width).toBe(215);
      await expect(line.width).toBe(215);
      await expect(line.top - button.bottom).toBe(2);
    }
    // The next button is further from a line than that line's own.
    await expect(rows[1].button.top - rows[0].line.bottom).toBe(8);
  },
};

/** Once: a double press answers one time, and every control stays disabled until the outcome arrives. */
export const Answering: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const kjp = canvas.getByRole('button', { name: 'KJP only' });
    await userEvent.dblClick(kjp);
    await expect(args.onAnswer).toHaveBeenCalledTimes(1);
    await expect(args.onAnswer).toHaveBeenCalledWith({ kind: 'option', id: 'kjp' });
    for (const button of canvas.getAllByRole('button')) {
      await expect(button).toHaveAttribute('aria-disabled', 'true');
    }
    await expect(kjp).toHaveFocus();
  },
};

/** Answered: the outcome takes the controls' place, and the block's label says so. */
export const Answered: Story = {
  parameters: { authorship: 'AI · Answered' },
  args: { outcome: answered },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getByText(answered)).toBeVisible();
    // Mounted already decided, so it takes no focus from the page.
    await expect(canvas.getByText(answered)).not.toHaveFocus();
  },
};

/** Choose for me: the agent decides, and says what it chose and why. */
export const ChosenByTheAgent: Story = {
  parameters: { authorship: 'AI · Answered' },
  args: { outcome: 'I chose all entities: KJP alone leaves out the KUS invoices.' },
};

/**
 * Five options or more go in a Select, one row however long the list, and
 * Answer sends the pick. Answer stays disabled until there is one.
 */
export const ManyOptions: Story = {
  args: {
    title: 'Which month should the variance end on?',
    options: ['April', 'May', 'June', 'July', 'August', 'September'].map((m) => ({ id: m.toLowerCase(), label: m })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('group')).toBeNull();
    await expect(canvas.getByRole('combobox', { name: 'Which month should the variance end on?' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Answer' })).toHaveAttribute('aria-disabled', 'true');
  },
};

/** A fact the options can't hold: no options, a text field, and Answer to send it. Enter sends it too. */
export const Fact: Story = {
  args: {
    title: 'Which account holds the intercompany FX gain?',
    options: [],
    text: { label: 'Account' },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Account');
    await expect(canvas.getByRole('button', { name: 'Answer' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.type(field, '7820 FX gain{Enter}');
    await expect(args.onAnswer).toHaveBeenCalledWith({ kind: 'text', text: '7820 FX gain' });
    await expect(field).toHaveFocus();
  },
};

/** Options and a field together: a word for the common answers, the field for anything else. */
export const OptionsAndText: Story = {
  args: { text: { label: 'Or name the entities' } },
};

/**
 * The whole exchange, live: answer, and the outcome replaces the controls,
 * with focus moved to it, so focus is never dropped on the page.
 */
export const Decide: Story = {
  render: function Render(args) {
    const [outcome, setOutcome] = useState<string>();
    const label = (a: QuestionAnswer) =>
      a.kind === 'option'
        ? `Answered by you: ${entities.find((e) => e.id === a.id)?.label}.`
        : a.kind === 'skip'
          ? 'Skipped by you. I’ll cover all entities, and say so in the summary.'
          : 'I chose all entities: KJP alone leaves out the KUS invoices.';
    return (
      <Question
        {...args}
        onAnswer={(a) => {
          args.onAnswer?.(a);
          setOutcome(label(a));
        }}
        outcome={outcome}
      />
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Skip' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onAnswer).toHaveBeenCalledWith({ kind: 'skip' });
    await waitFor(() => expect(canvas.getByText(/^Skipped by you\./)).toHaveFocus());
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};
