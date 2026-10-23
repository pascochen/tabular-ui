import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ArrowClockwiseIcon, ArrowRightIcon, CaretUpIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';

import { Button } from './index';
import { buttonVariants } from './variants';

/**
 * Mode is driven by the toolbar Theme control ([data-theme] on the root).
 * Dark is canonical; check every story in both.
 */
const meta = {
  title: 'Foundational/Button',
  component: Button,
  parameters: { layout: 'padded' },
  args: { children: 'Run pipeline' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-group)' }}>
    <span
      className="text-text-secondary"
      style={{ width: 96, fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>{children}</div>
  </div>
);

export const Default: Story = {};

/** All four variants. Only `danger` carries a hue — §0 rule 1. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="default">
        <Button>Run pipeline</Button>
      </Row>
      <Row label="outline">
        <Button variant="outline">Cancel</Button>
      </Row>
      <Row label="ghost">
        <Button variant="ghost">Dismiss</Button>
      </Row>
      <Row label="danger">
        <Button variant="danger">Delete model</Button>
      </Row>
    </div>
  ),
};

/** 24 / 32 / 36px — `--h-control-sm`, `--h-control`, `--h-control-lg`. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="sm · 24px">
        <Button size="sm">Retry</Button>
        <Button size="sm" variant="outline">
          Retry
        </Button>
      </Row>
      <Row label="default · 32px">
        <Button>Run pipeline</Button>
        <Button variant="outline">Run pipeline</Button>
      </Row>
      <Row label="lg · 36px">
        <Button size="lg">Run pipeline</Button>
        <Button size="lg" variant="outline">
          Run pipeline
        </Button>
      </Row>
    </div>
  ),
};

/** Icons sit at 1em and inherit currentColor — §11.3. */
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="leading">
        <Button>
          <PlusIcon weight="bold" aria-hidden="true" />
          New model
        </Button>
        <Button variant="outline">
          <ArrowClockwiseIcon weight="bold" aria-hidden="true" />
          Re-run
        </Button>
      </Row>
      <Row label="trailing">
        <Button variant="outline">
          Next step
          <ArrowRightIcon weight="bold" aria-hidden="true" />
        </Button>
      </Row>
      <Row label="both">
        <Button variant="outline">
          <ArrowClockwiseIcon weight="bold" aria-hidden="true" />
          Re-run
          <ArrowRightIcon weight="bold" aria-hidden="true" />
        </Button>
      </Row>
      <Row label="danger">
        <Button variant="danger">
          <TrashIcon weight="bold" aria-hidden="true" />
          Delete model
        </Button>
      </Row>
      <Row label="no icon">
        <Button variant="outline">Cancel</Button>
      </Row>
    </div>
  ),
};

/**
 * Disabled recedes as a whole — a dimmed label on a full-strength fill reads
 * as enabled — and its icon drops from `bold` to `light` (§11.2), even on
 * the danger variant. The enabled row above each is for comparison.
 */
export const Disabled: Story = {
  render: () => {
    const row = (disabled: boolean) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
        <Button disabled={disabled}>
          <ArrowClockwiseIcon />
          Run pipeline
        </Button>
        <Button variant="outline" disabled={disabled}>
          <PlusIcon />
          New model
        </Button>
        <Button variant="ghost" disabled={disabled}>
          Dismiss
        </Button>
        <Button variant="danger" disabled={disabled}>
          <TrashIcon />
          Delete model
        </Button>
      </div>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-group)' }}>
        {row(false)}
        {row(true)}
      </div>
    );
  },
};

/**
 * The dense case. `size="sm"` inside 28px rows, which is the reason
 * `--h-control-sm` exists. Density problems are invisible in isolation —
 * check that the button does not push the row taller and that the hover
 * overlay on the row still reads underneath the button.
 */
export const InTableRow: Story = {
  render: () => {
    const rows = [
      { model: 'fct_gl_entries', status: 'passed', rows: '1,284,102' },
      { model: 'dim_accounts', status: 'failed', rows: '8,214' },
      { model: 'stg_sap__bkpf', status: 'running', rows: '412,880' },
    ];
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          maxWidth: 560,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.model}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 'var(--h-row-sm)',
              padding: '0 var(--pad-cell-x)',
              gap: 'var(--pad-cell-x)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--text-sm--line-height)',
              borderTop: i === 0 ? undefined : '1px solid var(--color-border)',
            }}
          >
            <span
              className="font-mono text-text-body"
              style={{
                // §8.3: mono runs one step below adjacent sans — the row is
                // --text-sm, so identifiers are --text-xs.
                fontSize: 'var(--text-xs)',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.model}
            </span>
            <span
              className={
                r.status === 'failed'
                  ? 'text-text-danger'
                  : r.status === 'running'
                    ? 'text-text-info'
                    : 'text-text-success'
              }
              style={{ width: 64 }}
            >
              {r.status}
            </span>
            <span
              className="text-text-secondary"
              style={{ width: 88, textAlign: 'right', fontVariantNumeric: 'var(--font-numeric)' }}
            >
              {r.rows}
            </span>
            <Button size="sm" variant="ghost">
              <ArrowClockwiseIcon weight="bold" aria-hidden="true" />
              Re-run
            </Button>
          </div>
        ))}
      </div>
    );
  },
};

/** Long labels truncate rather than pushing the control wider. */
export const Truncation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-inline)', maxWidth: 260 }}>
      <Button style={{ minWidth: 0 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Re-run every downstream dbt model</span>
      </Button>
    </div>
  ),
};

/**
 * `inline` — a button embedded in another component's structure, like a
 * sortable column header or a tree row. No ground, border, padding or hover
 * fill: the context sets size, case, colour and alignment, and the row around
 * it owns hover. What the button adds is Base UI's behaviour and the system
 * focus ring. Weight is normal; set it if the context needs more. Use this
 * instead of a hand-styled `<button>`, which lint now rejects outside the
 * foundational layer. `DataTable`'s sort headers and `LineageTree`'s rows use it.
 */
export const Inline: Story = {
  render: () => (
    <div
      data-testid="header-cell"
      className="text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary"
      style={{
        width: 200,
        padding: '0 var(--pad-cell-x)',
        height: 'var(--h-row-sm)',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Button
        variant="inline"
        className="w-full justify-start gap-[var(--gap-icon-label)] font-medium hover:text-text-body"
      >
        Amount
        <CaretUpIcon weight="bold" aria-hidden="true" className="size-2.5 text-text-interactive" />
      </Button>
    </div>
  ),
  // The contract: it takes the context's type and adds no box of its own.
  play: async ({ canvasElement }) => {
    const cell = within(canvasElement).getByTestId('header-cell');
    const button = within(canvasElement).getByRole('button', { name: 'Amount' });
    const b = getComputedStyle(button);
    const c = getComputedStyle(cell);
    await expect(b.fontSize).toBe(c.fontSize);
    await expect(b.textTransform).toBe('uppercase');
    await expect(b.color).toBe(c.color);
    await expect([b.paddingLeft, b.paddingRight, b.borderLeftWidth]).toEqual(['0px', '0px', '0px']);
    await expect(b.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  },
};

/**
 * Test only, hidden from the sidebar and docs so nobody copies it:
 * `destructive` is the deprecated spelling of `danger` (renamed 2026-10-10),
 * still honoured. It must render exactly as `danger` does.
 */
export const DeprecatedDestructiveSpelling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-group)' }}>
      {/* eslint-disable-next-line no-restricted-syntax -- exercising the deprecated spelling on purpose */}
      <Button variant="destructive">Legacy</Button>
      <Button variant="danger">Current</Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const legacy = canvas.getByRole('button', { name: 'Legacy' });
    await expect(legacy.className).toBe(canvas.getByRole('button', { name: 'Current' }).className);
    await expect(legacy.className).toContain('text-text-danger');
    // eslint-disable-next-line no-restricted-syntax -- the exported cva, old spelling
    await expect(buttonVariants({ variant: 'destructive' })).toBe(buttonVariants({ variant: 'danger' }));
  },
};
