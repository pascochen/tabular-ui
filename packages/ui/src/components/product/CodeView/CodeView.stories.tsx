import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { CodeView } from './index';

const meta = {
  title: 'Product/CodeView',
  component: CodeView,
  parameters: { layout: 'padded' },
  args: { children: '' },
} satisfies Meta<typeof CodeView>;
export default meta;
type Story = StoryObj<typeof meta>;

const MODEL = `{{ config(materialized='incremental', unique_key='account_id') }}

select
    account_id,
    account_name,
    cost_center_id,
    valid_from,
    coalesce(valid_to, '9999-12-31') as valid_to
from {{ ref('stg_sap__skat') }}
where loaded_at > (select max(loaded_at) from {{ this }})`;

export const Default: Story = { args: { children: MODEL, language: 'sql' } };

export const WithLineNumbers: Story = { args: { children: MODEL, language: 'sql', showLineNumbers: true } };

/**
 * The one place colour appears: the line an error points at. That is state,
 * not syntax — which is exactly why the rest is deliberately unhighlighted.
 */
export const WithErrorLine: Story = {
  args: { children: MODEL, language: 'sql', showLineNumbers: true, highlightLines: [10] },
};

/**
 * Long lines scroll horizontally; the gutter stays pinned. Because it scrolls,
 * it is a named, focusable region: a keyboard user reaches it with Tab and
 * scrolls with the arrow keys (WCAG 2.1.1).
 */
export const Overflow: Story = {
  args: {
    showLineNumbers: true,
    language: 'sql',
    children: `select account_id, account_name, cost_center_id, valid_from, valid_to, loaded_at, source_system, is_current, checksum from {{ ref('stg_sap__skat') }} where loaded_at > '2026-01-01'`,
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: 'SQL code' });
    await expect(region).toHaveAttribute('tabindex', '0');
  },
};

/** A snippet that fits is not a tab stop: there is nothing to scroll to. */
export const Fits: Story = {
  args: { children: 'select 1', language: 'sql' },
  play: async ({ canvasElement }) => {
    const view = canvasElement.querySelector('[data-slot="code-view"]');
    await expect(view).not.toHaveAttribute('tabindex');
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
  },
};
