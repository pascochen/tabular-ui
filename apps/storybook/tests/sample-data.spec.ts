import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * Kasane Corporation, the sample data's only company, reports in yen (the
 * Kasane dataset, built into packages/ui/src/fixtures/kasane.ts and
 * apps/demo/data/). A compact dollar figure on a screen is a leftover from
 * placeholder data, not a Kasane number.
 *
 * Nothing here needs a browser; it reads tracked files.
 */

const root = path.resolve(import.meta.dirname, '../../..');
const self = 'apps/storybook/tests/sample-data.spec.ts';
const tracked = (...paths: string[]) =>
  execFileSync('git', ['ls-files', '--', ...paths], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(tsx?|mjs|md)$/.test(f));

/**
 * A compact dollar figure (`$847.2M`). Group figures are yen. The spec (§8)
 * and MetricTile's docs keep one `$847.2M` as a measured type specimen, so
 * only what is shown — stories, tests and app screens — is checked.
 */
const COMPACT_DOLLARS = /\$\d[\d.,]*[MBK]\b/;

test('stories, tests and apps show group figures in yen, not compact dollars', () => {
  const hits: string[] = [];
  // Stories and screens only: component docs keep the spec's measured specimen.
  const shown = tracked('packages/ui/src', 'apps/storybook/tests', 'apps/demo/src').filter(
    (f) => f.endsWith('.stories.tsx') || f.startsWith('apps/'),
  );
  for (const file of shown) {
    if (file === self) continue;
    readFileSync(path.join(root, file), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (COMPACT_DOLLARS.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
  expect(hits).toEqual([]);
});

test('the guard itself catches what it is for', () => {
  expect(COMPACT_DOLLARS.test('value="$847.2M"')).toBe(true);
  expect(COMPACT_DOLLARS.test('$48,216.40 each')).toBe(false);
});
