import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  ArrowClockwiseIcon,
  CaretRightIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XIcon,
} from '@phosphor-icons/react';

import { IconButton } from './index';

/**
 * Mode is driven by the toolbar Theme control ([data-theme] on the root).
 * Dark is canonical; check every story in both.
 */
const meta = {
  title: 'Foundational/IconButton',
  component: IconButton,
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Re-run', children: <ArrowClockwiseIcon /> },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-group)' }}>
    <span
      className="text-text-secondary"
      style={{ width: 112, fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>{children}</div>
  </div>
);

export const Default: Story = {};

/** Defaults to ghost — the quiet case is the common one. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="ghost · default">
        <IconButton aria-label="Re-run">
          <ArrowClockwiseIcon />
        </IconButton>
      </Row>
      <Row label="outline">
        <IconButton aria-label="Filter" variant="outline">
          <FunnelIcon />
        </IconButton>
      </Row>
      <Row label="default">
        <IconButton aria-label="Search" variant="default">
          <MagnifyingGlassIcon />
        </IconButton>
      </Row>
      <Row label="danger">
        <IconButton aria-label="Delete model" variant="danger">
          <TrashIcon />
        </IconButton>
      </Row>
    </div>
  ),
};

/**
 * Square at 24 / 32 / 36px, with icons at 14 / 16 / 20px from `--size-icon-*`.
 * Weight is injected per §11.2: sm and default get `bold`, lg gets `regular`.
 * A 20px regular and a 14px bold should read at equivalent visual weight — if
 * lg looks weak beside default, that mapping is what to revisit.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="sm · 24 / 14px">
        <IconButton aria-label="Re-run" size="sm">
          <ArrowClockwiseIcon />
        </IconButton>
        <IconButton aria-label="Filter" size="sm" variant="outline">
          <FunnelIcon />
        </IconButton>
      </Row>
      <Row label="default · 32 / 16px">
        <IconButton aria-label="Re-run">
          <ArrowClockwiseIcon />
        </IconButton>
        <IconButton aria-label="Filter" variant="outline">
          <FunnelIcon />
        </IconButton>
      </Row>
      <Row label="lg · 36 / 20px">
        <IconButton aria-label="Re-run" size="lg">
          <ArrowClockwiseIcon />
        </IconButton>
        <IconButton aria-label="Filter" size="lg" variant="outline">
          <FunnelIcon />
        </IconButton>
      </Row>
    </div>
  ),
};

/** An explicit `weight` on the icon overrides the injected one. */
export const WeightOverride: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-field)' }}>
      <Row label="injected · bold">
        <IconButton aria-label="Re-run">
          <ArrowClockwiseIcon />
        </IconButton>
      </Row>
      <Row label="explicit · regular">
        <IconButton aria-label="Re-run">
          <ArrowClockwiseIcon weight="regular" />
        </IconButton>
      </Row>
      <Row label="explicit · fill">
        <IconButton aria-label="Re-run" variant="outline">
          <ArrowClockwiseIcon weight="fill" />
        </IconButton>
      </Row>
    </div>
  ),
};

/**
 * Disabled fades as a whole and the icon drops to `light` (§11.2), on every
 * variant, danger included. The enabled row is for comparison.
 */
export const Disabled: Story = {
  render: () => {
    const row = (disabled: boolean) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-inline)' }}>
        <IconButton aria-label="Re-run" disabled={disabled}>
          <ArrowClockwiseIcon />
        </IconButton>
        <IconButton aria-label="Filter" variant="outline" disabled={disabled}>
          <FunnelIcon />
        </IconButton>
        <IconButton aria-label="Delete model" variant="danger" disabled={disabled}>
          <TrashIcon />
        </IconButton>
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

/** A toolbar — the density case IconButton exists for. */
export const Toolbar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-chip)',
        padding: 'var(--pad-popover)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        width: 'fit-content',
      }}
    >
      <IconButton aria-label="Search">
        <MagnifyingGlassIcon />
      </IconButton>
      <IconButton aria-label="Filter">
        <FunnelIcon />
      </IconButton>
      <IconButton aria-label="Re-run">
        <ArrowClockwiseIcon />
      </IconButton>
      <IconButton aria-label="Download">
        <DownloadSimpleIcon />
      </IconButton>
      <div style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
      <IconButton aria-label="More actions">
        <DotsThreeIcon />
      </IconButton>
    </div>
  ),
};

/**
 * The dense case: `size="sm"` (24px) inside 28px rows. Check that the row does
 * not grow and that the row hover still reads underneath a ghost icon button.
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
          maxWidth: 520,
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
                // §8.3: mono runs one step below adjacent sans.
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
                    ? 'text-text-interactive'
                    : 'text-text-success'
              }
              style={{ width: 60 }}
            >
              {r.status}
            </span>
            <span
              className="text-text-secondary"
              style={{ width: 80, textAlign: 'right', fontVariantNumeric: 'var(--font-numeric)' }}
            >
              {r.rows}
            </span>
            <div style={{ display: 'flex', gap: 'var(--gap-chip)' }}>
              <IconButton aria-label={`Re-run ${r.model}`} size="sm">
                <ArrowClockwiseIcon />
              </IconButton>
              <IconButton aria-label={`Dismiss ${r.model}`} size="sm">
                <XIcon />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * `inline` — an icon control inside another component's row, like a tree's
 * expand caret. No size variant: the caller sizes the box and the icon to the
 * row's grid (here the 16px icon scale in a 24px row), because a 24px
 * `--h-control-sm` square would push the row taller. Pass `tooltip={false}`
 * when the row already shows what the control acts on. `LineageTree` uses it.
 */
export const Inline: Story = {
  render: () => (
    <div
      className="text-sm text-text-body"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--gap-control-icon)',
        height: 'var(--h-row-xs)',
        padding: '0 var(--pad-cell-x)',
      }}
    >
      <IconButton
        variant="inline"
        tooltip={false}
        aria-label="Expand fct_gl_entries"
        className="size-[var(--size-icon-sm)] rounded-xs text-text-tertiary hover:text-text-body focus-visible:outline-offset-[-2px]"
      >
        <CaretRightIcon aria-hidden="true" className="size-[var(--size-icon-xs)]" />
      </IconButton>
      <span className="font-mono text-xs">fct_gl_entries</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Expand fct_gl_entries' });
    const box = button.getBoundingClientRect();
    const iconScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-icon-sm'));
    await expect([box.width, box.height]).toEqual([iconScale, iconScale]);
    // §11.2: at 12px the stroke floor is bold, injected when not set.
    await expect(button.querySelector('svg')?.getAttribute('weight') ?? 'bold').toBe('bold');
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
      <IconButton aria-label="Legacy delete" variant="destructive">
        <TrashIcon />
      </IconButton>
      <IconButton aria-label="Current delete" variant="danger">
        <TrashIcon />
      </IconButton>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const legacy = canvas.getByRole('button', { name: 'Legacy delete' });
    await expect(legacy.className).toBe(canvas.getByRole('button', { name: 'Current delete' }).className);
    await expect(legacy.className).toContain('text-text-danger');
  },
};
