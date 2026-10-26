import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { money as storyMoney } from '../../../packages/ui/src/fixtures/format';
import { money } from '../src/lib/format';

/**
 * The site formats money by the stories' rules, kept in its own copy because it
 * may not import story fixtures (docs/site.md §5). Same inputs, same outputs.
 */
test('money() matches the library stories’ formatter', () => {
  const cases: [number, Parameters<typeof money>[1]][] = [
    [34_436_068_352, 'JPY'],
    [355_192_561, 'JPY'],
    [-41_415_809, 'JPY'],
    [3_708_818, 'JPY'],
    [42_700_000, 'JPY'],
    [999_999, 'JPY'],
    [48_216.4, 'USD'],
    [600_000, 'USD'],
    [-18_400, 'GBP'],
    [22_550_000, 'EUR'],
    [0, 'JPY'],
  ];
  for (const [value, currency] of cases)
    expect(money(value, currency), `${value} ${currency}`).toBe(storyMoney(value, currency));
});

/**
 * Every figure comes from data/kasane.json (§5). A currency amount or a
 * thousands-grouped number typed into src/ fails here, rather than shipping a
 * figure with no entry behind it.
 */
test('src/ types no figure', () => {
  const src = fileURLToPath(new URL('../src', import.meta.url));
  const files = (function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : /\.(tsx?|css)$/.test(name) ? [path] : [];
    });
  })(src);
  const typed = /[¥$€£]\s?\d|\b\d{1,3}(?:,\d{3})+\b/;
  // Comments may quote a figure to explain a rule; only code and copy can ship one.
  const comment = /^\s*(?:\/\/|\/\*|\*)/;
  const found = files.flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line, i) => ({ line, at: `${file.slice(src.length + 1)}:${i + 1}` }))
      .filter(({ line }) => typed.test(line) && !comment.test(line))
      .map(({ at, line }) => `${at}: ${line.trim()}`),
  );
  expect(found).toEqual([]);
});
