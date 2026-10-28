import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { AgentBlock } from '../AgentBlock';
import { Tool, ToolGroup, type ToolCall } from './index';

/** §8.3: a file name in mono, one step below the --text-sm line. */
function Ident({ children }: { children: string }) {
  return <code className="font-mono text-xs">{children}</code>;
}

const invoices = 'supplier_invoices_fy2026_h1.csv';
const interview = '05_interview_ar_ap_2026-10-14.txt';
const bank = 'bank_export_kjp_2026-09.csv';

/** Kasane's duplicate payment: the three files the answer read. */
const readInvoices = {
  running: (
    <>
      Reading <Ident>{invoices}</Ident>
    </>
  ),
  done: (
    <>
      Read <Ident>{invoices}</Ident>
    </>
  ),
  detail: (
    <>
      Supplier invoice <Ident>MFL-58821</Ident> appears twice, as <Ident>API-KUS-2607-00007</Ident> and{' '}
      <Ident>API-KUS-2607-00011</Ident>, $48,216.40 each, and both are paid.
    </>
  ),
};

const readInterview = {
  running: (
    <>
      Reading <Ident>{interview}</Ident>
    </>
  ),
  done: (
    <>
      Read <Ident>{interview}</Ident>
    </>
  ),
  detail: 'AP says the system blocks a repeated supplier invoice number in every entity.',
};

/** The failure is real: the bank export has no header row (findings.json, bank-header). */
const bankFailure = {
  error: (
    <>
      Couldn’t match <Ident>{bank}</Ident> to fields: it has no header row.
    </>
  ),
  next: 'I’ll take both payments as the invoice file records them.',
};

const readBank = {
  running: (
    <>
      Reading <Ident>{bank}</Ident>
    </>
  ),
};

type GroupCall = ToolCall & { id: string };

const allDone: GroupCall[] = [
  { ...readInvoices, id: 'invoices', status: 'done' },
  { ...readInterview, id: 'interview', status: 'done' },
];

const withFailure: GroupCall[] = [...allDone, { ...readBank, id: 'bank', status: 'failed', ...bankFailure }];

/**
 * Tool is a part of an AgentBlock, so every story renders it inside one, at
 * the chat panel's width (--w-panel) on the panel's ground.
 */
const meta: Meta = {
  title: 'Product/Tool',
  component: Tool,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[var(--w-panel)] bg-surface px-[var(--pad-page-x)] py-[var(--pad-page-y)]">
        <AgentBlock authorship="AI">
          <Story />
        </AgentBlock>
      </div>
    ),
  ],
};
export default meta;
// Every story renders its own Tool: Storybook's args types can't hold a
// union of props, which is what keeps `done` off a running call.
type Story = StoryObj;

/** Running: what it's doing, in the present, with the spinner. Never the past tense yet. */
export const Running: Story = {
  render: () => <Tool {...readInvoices} status="running" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: `Reading ${invoices}` });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(/^Read /)).toBeNull();
  },
};

/** Done, folded: the default. One line, in the past, that opens to what it read. */
export const Done: Story = {
  render: () => <Tool {...readInvoices} status="done" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: `Read ${invoices}` });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(/appears twice/)).toBeVisible();
    // Mounted done: nothing to announce, so a reader of the transcript hears the line once.
    await expect(canvas.getByRole('status')).toBeEmptyDOMElement();
  },
};

/** Nothing to open: a plain line, no caret. */
export const NoDetail: Story = {
  render: () => <Tool {...readInvoices} detail={undefined} status="done" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
  },
};

/**
 * Failed: what failed and what happens next, always visible, never folded.
 * The icon's shape and the words carry it, not the colour alone.
 */
export const Failed: Story = {
  render: () => <Tool {...readBank} status="failed" {...bankFailure} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/has no header row/)).toBeVisible();
    await expect(canvas.getByText(bankFailure.next)).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

/**
 * Runs, then finishes while you watch. The live region says the past tense
 * once the call has run, then empties.
 */
export const Finishes: Story = {
  render: function Finishes() {
    const [done, setDone] = useState(false);
    useEffect(() => {
      const timer = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(timer);
    }, []);
    return <Tool {...readInvoices} status={done ? 'done' : 'running'} />;
  },
  play: async ({ canvasElement }) => {
    const status = within(canvasElement).getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent(`Read ${invoices}`), { timeout: 3000 });
  },
};

/** Calls in a row fold into one line, in the past once every call has run. */
export const Group: Story = {
  render: () => <ToolGroup summary="Read 2 files" calls={allDone} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Read 2 files' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByText(invoices)).toBeNull();
    await userEvent.click(toggle);
    // Each call is its own line, and opens on its own.
    const invoicesLine = canvas.getByRole('button', { name: `Read ${invoices}` });
    await expect(canvas.getByRole('button', { name: `Read ${interview}` })).toBeVisible();
    await userEvent.click(invoicesLine);
    await expect(canvas.getByText(/appears twice/)).toBeVisible();
  },
};

/** While a call runs, the line says what that one is doing. The summary waits for the last. */
export const GroupRunning: Story = {
  render: () => (
    <ToolGroup
      summary="Read 3 files"
      calls={[
        { ...readInvoices, id: 'invoices', status: 'done' },
        { ...readInterview, id: 'interview', status: 'running' },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: `Reading ${interview}` })).toBeVisible();
    await expect(canvas.queryByText('Read 3 files')).toBeNull();
  },
};

/** A failed call shows under the group's line, open or folded, with its next step. */
export const GroupWithFailure: Story = {
  render: () => <ToolGroup summary="Read 3 files" calls={withFailure} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Read 3 files' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText(/has no header row/)).toBeVisible();
    await expect(canvas.getByText(bankFailure.next)).toBeVisible();
    await expect(canvas.queryByText(invoices)).toBeNull();
  },
};

/** Opened: every call in order, the failure in its place. */
export const GroupOpen: Story = {
  render: () => <ToolGroup summary="Read 3 files" calls={withFailure} defaultOpen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(3);
    await expect(items[2]).toHaveTextContent(/has no header row/);
  },
};

/**
 * In a turn: the reads, then the answer they led to, in one AgentBlock, as
 * ChatThread lays out a turn.
 */
export const InATurn: Story = {
  name: 'In a turn',
  render: () => (
    <div className="flex flex-col gap-[var(--gap-group)]">
      <ToolGroup summary="Read 3 files" calls={withFailure} />
      <p>
        Yes. Invoice <code className="font-mono text-sm">MFL-58821</code> was entered twice and paid twice,{' '}
        <span className="tabular-nums">$48,216.40</span> each time.
      </p>
    </div>
  ),
};
