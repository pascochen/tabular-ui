import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import type { Source } from '../Sources';
import { InlineCitation } from './index';

/** Kasane's duplicate payment, as in the Sources stories. */
const invoices: Source = { id: 'invoices', name: 'supplier_invoices_fy2026_h1.csv', href: '#' };
const interview: Source = { id: 'interview', name: '05_interview_ar_ap_2026-10-14.txt' };

/**
 * A citation sits in an answer's line, so every story renders it in agent
 * prose, at the chat panel's width on the panel's ground.
 */
const meta = {
  title: 'Product/InlineCitation',
  component: InlineCitation,
  parameters: { layout: 'padded' },
  args: { number: 1, source: invoices, locator: 'API-KUS-2607-00007 and API-KUS-2607-00011' },
  decorators: [
    (Story) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship="AI" meta="14:22">
          <p>
            Yes. Invoice <code className="font-mono text-sm">MFL-58821</code> was entered twice and paid twice,{' '}
            <span className="tabular-nums">$48,216.40</span> each time.
            <Story />
          </p>
        </AgentBlock>
      </div>
    ),
  ],
} satisfies Meta<typeof InlineCitation>;
export default meta;
type Story = StoryObj<typeof meta>;

/** At rest: the source's number, in the line it supports. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const mark = within(canvasElement).getByRole('button', { name: 'Source 1: supplier_invoices_fy2026_h1.csv' });
    await expect(mark).toHaveTextContent('1');
    // The mark must not grow the line it sits in: a --text-base line is 20px.
    await expect(mark.getBoundingClientRect().height).toBe(16);
    await expect((mark.parentElement as HTMLElement).getBoundingClientRect().height % 20).toBe(0);
    // It brings a no-break space, so it can't start a line alone.
    await expect(mark.previousSibling?.textContent).toBe('\u00A0');
  },
};

/**
 * Open: the file, as a link, and where in it the figure comes from. A
 * Popover, so all of it reaches a screen reader, and Escape returns focus to
 * the mark.
 */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const mark = within(canvasElement).getByRole('button', { name: /^Source 1/ });
    await userEvent.click(mark);
    const popup = await within(document.body).findByRole('dialog', { name: /supplier_invoices_fy2026_h1\.csv/ });
    // The popup fades in: wait for it, not just for it to mount.
    const link = within(popup).getByRole('link', { name: 'supplier_invoices_fy2026_h1.csv' });
    await waitFor(() => expect(link).toBeVisible());
    await expect(popup).toHaveAccessibleDescription('API-KUS-2607-00007 and API-KUS-2607-00011');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(mark).toHaveFocus());
    // Open again for the screenshot, which shows the popover.
    await userEvent.click(mark);
    await within(document.body).findByRole('dialog');
  },
};

/** A source with no link and no locator still names itself. */
export const NameOnly: Story = {
  args: { number: 2, source: interview, locator: undefined },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /^Source 2/ }));
    const popup = await within(document.body).findByRole('dialog');
    await expect(within(popup).queryByRole('link')).toBeNull();
    await expect(popup).toHaveTextContent('05_interview_ar_ap_2026-10-14.txt');
  },
};

/** Two digits stay in the same 16px line box. */
export const TwoDigits: Story = {
  args: { number: 12 },
};
