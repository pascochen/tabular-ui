import { expect, test } from '@playwright/test';

import { readFileSync } from 'node:fs';

import { makeTokens, type Palette } from '../src/tokens-parse';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const { contrast, onCanvas, px, roles, stepLabel, themeToken, themeTokensWith, tokenStep } = makeTokens(
  read('../../../packages/ui/src/styles/theme.css'),
  JSON.parse(read('../../../docs/palette.json')) as Palette,
);
const kasane = JSON.parse(read('../data/kasane.json')) as {
  operatingBridge: { budget: number; actual: number; steps: { value: number }[] };
};

/**
 * The Foundations pages read theme.css and palette.json at build time. These
 * pin the parser to figures the spec states, so a parser that silently reads
 * the wrong block fails here rather than on a page.
 */
test('role tokens resolve to the spec’s steps, both modes (§4)', () => {
  // Every role that takes a hue. Interactive text is ink since 2026-11-09 (§1).
  for (const role of roles.filter((r) => r !== 'interactive')) {
    expect(tokenStep(`text-${role}`, 'dark').step).toBe('400');
  }
  expect(stepLabel(tokenStep('text-interactive', 'dark'))).toBe('ledger-50');
  expect(stepLabel(tokenStep('text-interactive', 'light'))).toBe('ledger-950');
  expect(stepLabel(tokenStep('text-success', 'light'))).toBe('ivy-700');
  expect(stepLabel(tokenStep('bg-warning', 'light'))).toBe('ochre-500 / 10%');
  expect(stepLabel(tokenStep('fill-warning', 'light'))).toBe('ochre-500');
  expect(stepLabel(tokenStep('surface-raised', 'dark'))).toBe('ledger-925');
  // §3, 2026-11-12: the page is a warm white, and the paper is the frame beside it.
  expect(stepLabel(tokenStep('canvas', 'light'))).toBe('ledger-25');
  expect(stepLabel(tokenStep('surface-sunken', 'light'))).toBe('ledger-50');
  expect(stepLabel(tokenStep('surface-sunken', 'dark'))).toBe('ledger-950');
});

test('contrast matches the spec’s measured ratios (§3, §4)', () => {
  expect(onCanvas(tokenStep('text-success', 'light'), 'light')).toBe('6.55:1');
  expect(onCanvas(tokenStep('text-primary', 'dark'), 'dark')).toBe('16.49:1');
  expect(onCanvas(tokenStep('text-secondary', 'light'), 'light')).toBe('6.95:1');
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
});

test('scale tokens read with their values and notes', () => {
  expect(px(themeToken('--text-base').value)).toBe(13);
  expect(themeToken('--pad-cell-x').value).toBe('8px');
  expect(themeToken('--h-control').note).toMatch(/default control/);
  expect(themeTokensWith('--radius-').map((t) => t.name)).toEqual([
    '--radius-xs',
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--radius-full',
  ]);
});

/** Parts shown beside their total must add up exactly (docs/site.md D5). */
test('the operating bridge foots: budget plus its steps is the actual', () => {
  const { budget, steps, actual } = kasane.operatingBridge;
  expect(budget + steps.reduce((sum, s) => sum + s.value, 0)).toBe(actual);
});
