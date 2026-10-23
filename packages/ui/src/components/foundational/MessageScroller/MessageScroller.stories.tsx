import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './index';

type Row = { id: string; author: string; text: string };

const lines = [
  'The SAP delta load finished at 06:12.',
  'stg_sap__bkpf picked up 412,880 rows.',
  'dim_accounts failed its uniqueness test on account_id.',
  'The duplicates came from the delta window overlapping the prior load.',
  'fct_ap_aging is waiting on dim_accounts.',
  'Can we re-run once the dedupe is in?',
];

const rows = (count: number): Row[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `m${i + 1}`,
    author: i % 2 ? 'a.kanzaki' : 'r.fujisawa',
    text: lines[i % lines.length],
  }));

/**
 * A plain row, so the scroller is shown without any product component. In
 * the product the rows are ChatThread's turns.
 */
function Rows({ items }: { items: Row[] }) {
  return items.map((row) => (
    <MessageScrollerItem key={row.id} messageId={row.id} scrollAnchor={row.author === 'r.fujisawa'}>
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <span className="text-xs font-medium text-text-secondary">{row.author}</span>
        <p className="text-base text-text-body">{row.text}</p>
      </div>
    </MessageScrollerItem>
  ));
}

/** The chat panel's width and ground, with a bounded height: the scroller fills its parent. */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-[var(--w-panel)] flex-col border border-border bg-surface" style={{ height: 360 }}>
      {children}
    </div>
  );
}

const meta = {
  title: 'Foundational/MessageScroller',
  component: MessageScroller,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MessageScroller>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Fits without scrolling: the button stays hidden and out of the tab order. */
export const Short: Story = {
  render: () => (
    <Frame>
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-[var(--pad-panel)]">
              <Rows items={rows(3)} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('region', { name: 'Messages' });
    await expect(viewport).toHaveAttribute('tabindex', '0');
    await expect(canvas.getByRole('log')).toBeInTheDocument();
    const button = canvasElement.querySelector('[data-slot="message-scroller-button"]');
    await expect(button).toHaveAttribute('data-active', 'false');
    await expect(button).toHaveAttribute('tabindex', '-1');
  },
};

/**
 * Opens at the start of a long transcript. "Scroll to latest" appears because
 * there is more below; pressing it goes to the end and the button retires.
 * Under reduced motion the jump is instant.
 *
 * It is instant here too when a browser is automated (`navigator.webdriver`),
 * as ChatThread's playback is. In dark mode on Linux, a smooth scroll leaves
 * one subpixel fringe pixel of a glyph where some mid-scroll frame drew it,
 * and which frames the scroll draws depends on timing. The screenshot then
 * differed by that pixel from run to run. A jump draws one frame and always
 * lands on the same pixels. The viewport's inherited background fixes the
 * fringe for people too (README, "It takes its parent's ground"); the jump
 * stays so the screenshot does not depend on that.
 */
export const Long: Story = {
  render: () => (
    <Frame>
      <MessageScrollerProvider defaultScrollPosition="start">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-[var(--pad-panel)]">
              <Rows items={rows(24)} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton behavior={navigator.webdriver ? 'auto' : undefined} />
        </MessageScroller>
      </MessageScrollerProvider>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('region', { name: 'Messages' });
    const button = canvas.getByRole('button', { name: 'Scroll to latest' });
    // Opaque, in the Frame's ground: the viewport inherits it through the frame.
    const ground = getComputedStyle(canvasElement.querySelector('[data-slot="message-scroller"]')!.parentElement!);
    await expect(getComputedStyle(viewport).backgroundColor).toBe(ground.backgroundColor);
    await expect(getComputedStyle(viewport).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    await waitFor(() => expect(button).toHaveAttribute('data-active', 'true'));
    await userEvent.click(button);
    await waitFor(() =>
      expect(Math.ceil(viewport.scrollTop + viewport.clientHeight)).toBeGreaterThanOrEqual(viewport.scrollHeight - 8),
    );
    await waitFor(() => expect(button).toHaveAttribute('data-active', 'false'));
  },
};

/**
 * A saved thread opens at its last anchored turn (`last-anchor`), not the
 * absolute bottom: the last question, with its answer below.
 */
export const OpensAtLastAnchor: Story = {
  render: () => (
    <Frame>
      <MessageScrollerProvider defaultScrollPosition="last-anchor">
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-[var(--pad-panel)]">
              <Rows items={rows(23)} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
          <MessageScrollerButton direction="start" />
        </MessageScroller>
      </MessageScrollerProvider>
    </Frame>
  ),
};
