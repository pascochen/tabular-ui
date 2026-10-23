import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { ALL_SCALES, BANNED_SCALES, RAMPS, STRIPPED } from '../../../lint/palette.mjs';

/**
 * The colour-scale list is shared by the lint rules (lint/palette.mjs). Five
 * other places can't import it, so this checks them against it:
 *
 * - Tailwind's own palette. When Tailwind 4.2 added mauve, mist and taupe,
 *   no list here named them, and `bg-mauve-400` passed every gate (CLAUDE.md
 *   failure log). A Tailwind update that adds a scale now fails here, on its
 *   Dependabot PR, until the scale is added to palette.mjs.
 * - theme.css's strip list, which is CSS and is edited only by transcribing
 *   the spec. Since the Riso Ledger palette (2026-10-16) it strips all of
 *   Tailwind's scales.
 * - palette.css, generated from docs/palette.json. It must define exactly the
 *   Riso ramps, with the generator's values, and load after theme.css: the
 *   strip removes Tailwind's teal, and a strip that ran after palette.css
 *   would silently remove the Riso teal ramp too.
 * - The design-review skill's grep, an agent instruction file kept by hand.
 *
 * Nothing here needs a browser; it reads files.
 */

// The repo root: the library, the lint list, the docs and the skill all live outside this app.
const root = path.resolve(import.meta.dirname, '../../..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
const sorted = (names: Iterable<string>) => [...new Set(names)].sort();

test("the shared list is exactly Tailwind's palette", () => {
  const tailwind = read('packages/ui/node_modules/tailwindcss/theme.css');
  const scales = [...tailwind.matchAll(/--color-([a-z]+)-50:/g)].map((m) => m[1]);
  expect(scales.length, "found Tailwind's palette").toBeGreaterThan(20);
  expect(sorted(ALL_SCALES), 'lint/palette.mjs against Tailwind theme.css').toEqual(sorted(scales));
});

test("theme.css strips every one of Tailwind's scales", () => {
  const theme = read('packages/ui/src/styles/theme.css');
  const stripped = [...theme.matchAll(/--color-([a-z]+)-\*:\s*initial/g)].map((m) => m[1]);
  expect(sorted(stripped), 'the strip list in theme.css').toEqual(sorted(STRIPPED));
});

test('palette.css defines exactly the Riso ramps, with the generated values', () => {
  const css = read('packages/ui/src/styles/palette.css');
  const json = JSON.parse(read('docs/palette.json')) as { ramps: Record<string, Record<string, { oklch: string }>> };
  const declared = new Map(
    [...css.matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)].map((m) => [`${m[1]}-${m[2]}`, m[3]]),
  );
  const expected = new Map(
    Object.entries(json.ramps).flatMap(([ramp, steps]) =>
      Object.entries(steps).map(([step, { oklch }]) => [`${ramp}-${step}`, oklch] as const),
    ),
  );
  expect(sorted(Object.keys(json.ramps)), 'docs/palette.json ramps against lint/palette.mjs').toEqual(sorted(RAMPS));
  expect(Object.fromEntries(declared), 'palette.css against docs/palette.json: run the generator').toEqual(
    Object.fromEntries(expected),
  );
});

test('palette.css loads after theme.css, so the strip cannot erase the Riso teal', () => {
  const index = read('packages/ui/src/index.css');
  const theme = index.indexOf("@import './styles/theme.css'");
  const palette = index.indexOf("@import './styles/palette.css'");
  expect(theme, 'index.css imports theme.css').toBeGreaterThan(-1);
  expect(palette, 'index.css imports palette.css after theme.css').toBeGreaterThan(theme);
});

test("the design-review skill's raw-hue grep names every scale", () => {
  const skill = read('.claude/skills/design-review/SKILL.md');
  const grep = skill.match(/grep -rnE '\\b\(([a-z|]+)\)-\[0-9\]/);
  expect(grep, 'found the raw-hue grep').not.toBeNull();
  expect(sorted(grep![1].split('|')), '.claude/skills/design-review/SKILL.md').toEqual(sorted(BANNED_SCALES));
});
