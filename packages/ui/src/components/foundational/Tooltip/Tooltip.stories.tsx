import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from './index';

/**
 * `TooltipProvider` is mounted globally in `.storybook/preview.tsx`, matching
 * how an app must mount it once at the root. Without it these stories would
 * silently use Base UI's default delay rather than our 300ms.
 *
 * Mode is driven by the toolbar Theme control. Dark is canonical.
 */
const meta = {
  title: 'Foundational/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Re-run every downstream model</TooltipContent>
    </Tooltip>
  ),
};

/** Four sides. `sideOffset` defaults to 4px. */
export const Sides: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 'var(--gap-group)' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline">{side}</Button>} />
          <TooltipContent side={side}>Opens on {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

/**
 * The reason `CLAUDE.md` calls Tooltip non-optional: a truncated table cell is
 * unreadable without one. Hover the clipped model name.
 */
export const TruncatedCell: Story = {
  render: () => {
    const rows = ['fct_gl_entries_reconciliation_daily_v2', 'dim_accounts', 'stg_sap__bkpf_incremental_partitioned'];
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          width: 260,
        }}
      >
        {rows.map((model, i) => (
          <div
            key={model}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 'var(--h-row-sm)',
              padding: '0 var(--pad-cell-x)',
              borderTop: i === 0 ? undefined : '1px solid var(--color-border)',
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className="font-mono text-text-body"
                    style={{
                      // §8.3 mono one step below adjacent sans
                      fontSize: 'var(--text-xs)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'default',
                    }}
                  />
                }
              >
                {model}
              </TooltipTrigger>
              <TooltipContent>{model}</TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * `IconButton` wraps itself — its `aria-label` becomes the tooltip text with
 * no extra markup. Sweep across the group: the first opens after 300ms, the
 * rest open instantly while the group stays warm.
 */
export const AutomaticOnIconButton: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--gap-chip)' }}>
      <IconButton aria-label="Re-run">
        <ArrowClockwiseIcon />
      </IconButton>
      <IconButton aria-label="Re-run with a custom tooltip" tooltip="Re-run, skipping cache">
        <ArrowClockwiseIcon />
      </IconButton>
      <IconButton aria-label="No tooltip on this one" tooltip={false}>
        <ArrowClockwiseIcon />
      </IconButton>
    </div>
  ),
};

/** Long content wraps at max-w-xs rather than running off the viewport. */
export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Long tooltip</Button>} />
      <TooltipContent>
        This model failed its uniqueness test on account_id. 412 duplicate rows were written to the staging table before
        the run was halted.
      </TooltipContent>
    </Tooltip>
  ),
};
