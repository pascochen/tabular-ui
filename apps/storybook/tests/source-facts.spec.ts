import { expect, test } from '@playwright/test';

import { closeReducer, landingState } from '../../demo/src/lib/close-state';
import { documentOf, documents, exceptions, refOf } from '../../demo/src/lib/kasane';
import { restsOnLine, leftOutLine, readersOf, switchEffect } from '../../demo/src/lib/source-facts';

/**
 * What Sources says about a file beyond its contents
 * (apps/demo/src/lib/source-facts.ts). Every line is derived, so these read
 * the generated data. Nothing here needs a browser.
 */

test('every file names at least one agent that reads it, and a file no finding cites still does', () => {
  for (const d of documents) expect(readersOf(d.slug).length, d.slug).toBeGreaterThan(0);
  expect(readersOf('close-calendar').map((a) => a.name)).toEqual(['Revenue AI']);
});

test('what a finding rests on is counted against the rows on screen, or named by its lines', () => {
  const restsOn = (slug: string, item: string) => restsOnLine(documentOf(slug), refOf(item, slug)!);
  expect(restsOn('ar-aging', 'credit-limit')).toBe('This finding rests on 8 of the 18 rows shown.');
  expect(restsOn('sales-invoices', 'revenue-cut-off')).toBe('This finding rests on 1 of the 11 rows shown.');
  expect(restsOn('accounting-policies', 'revenue-cut-off')).toBe('This finding rests on line 26.');
  expect(restsOn('close-memo', 'credit-limit')).toBe('This finding rests on lines 37 to 39.');
});

test('a trimmed extract says what it leaves out, with the file’s own count', () => {
  expect(leftOutLine(documentOf('sales-invoices'))).toBe(
    "The file's other 876 rows aren't shown, so a claim about the whole file can't be checked here.",
  );
  expect(leftOutLine(documentOf('accounting-policies'))).toMatch(/^The file's other 87 lines aren't shown/);
  // Every extract in the demo is trimmed, so every finding's records carry the line.
  for (const e of exceptions) for (const r of e.refs) expect(leftOutLine(documentOf(r.doc)), r.doc).not.toBeNull();
});

test('the switch states who reads the file and what rests on it, then what turning it off leaves', () => {
  const on = landingState();
  expect(switchEffect(on, 'sales-invoices')).toBe('Revenue AI reads it. Revenue booked early rests on it.');
  expect(switchEffect(on, 'close-calendar')).toBe('Revenue AI reads it. No finding rests on it.');
  const off = (slug: string) => closeReducer(on, { type: 'source', id: slug, on: false });
  expect(switchEffect(off('sales-invoices'), 'sales-invoices')).toBe(
    "Off. Revenue AI doesn't read it. Revenue booked early can't be rechecked.",
  );
  expect(switchEffect(off('close-calendar'), 'close-calendar')).toBe("Off. Revenue AI doesn't read it.");
  // Turning one file off says nothing about another.
  expect(switchEffect(off('sales-invoices'), 'ar-aging')).toBe('Credit AI reads it. Credit limit rests on it.');
});
