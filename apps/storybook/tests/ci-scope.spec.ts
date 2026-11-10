import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { scope } from '../../../.github/scripts/ci-scope.mjs';

/**
 * What Verify may skip for a pull request (ci.yml's Scope step, which runs
 * .github/scripts/ci-scope.mjs).
 *
 * The rule was two greps in the workflow, under a comment that said no test,
 * build or story reads a .md file. tools.md said to remove the skip if that
 * ever changed, and nothing checked it. The site then began reading the
 * package README and every product README at build time, and a spec began
 * reading a skill, so a Markdown-only PR that renamed a README heading passed
 * Verify in a minute and failed the site build on main (found 2026-11-09).
 *
 * Nothing here needs a browser; it reads files.
 */

const root = path.resolve(import.meta.dirname, '../../..');

test('a change to Markdown nothing reads skips everything', () => {
  expect(scope(['docs/design-system.md', 'CLAUDE.md', 'tools.md'])).toEqual({ docs_only: true, site_only: false });
  expect(scope(['packages/ui/src/components/foundational/Button/README.md']).docs_only).toBe(true);
});

test('Markdown the site reads runs the site build and its tests', () => {
  for (const file of ['packages/ui/README.md', 'packages/ui/src/components/product/RunLogRow/README.md']) {
    expect(scope([file]), file).toEqual({ docs_only: false, site_only: true });
    expect(scope([file, 'docs/site.md']), `${file} with other docs`).toEqual({ docs_only: false, site_only: true });
  }
});

test('Markdown a library spec reads runs everything', () => {
  const skill = '.claude/skills/design-review/SKILL.md';
  expect(scope([skill])).toEqual({ docs_only: false, site_only: false });
  // Even beside a site change, which alone would be site-only.
  expect(scope([skill, 'apps/site/src/root.tsx'])).toEqual({ docs_only: false, site_only: false });
});

test('site files are site-only, and anything else is the full run', () => {
  expect(scope(['apps/site/src/root.tsx', 'docs/site.md'])).toEqual({ docs_only: false, site_only: true });
  expect(scope(['packages/ui/src/index.ts', 'docs/site.md'])).toEqual({ docs_only: false, site_only: false });
  // .mdx is Storybook's, so it is not docs.
  expect(scope(['packages/ui/src/Intro.mdx'])).toEqual({ docs_only: false, site_only: false });
});

test('a diff that could not be read is the full run', () => {
  expect(scope([])).toEqual({ docs_only: false, site_only: false });
  expect(scope(['', '  '])).toEqual({ docs_only: false, site_only: false });
});

/**
 * The lists in ci-scope.mjs are kept by hand, so this reads the code for them.
 * Every Markdown path that source, a test or a script loads (`?raw`,
 * `import.meta.glob`, `readFileSync`, a `read(` helper, `new URL(`) must not
 * be docs-only. A new reader of a .md file fails here until its path is added
 * to the list that matches what reads it.
 */
test('every Markdown file the code reads is outside the docs-only skip', () => {
  const dirs = [
    'apps/site/src',
    'apps/site/tests',
    'apps/demo/src',
    'apps/storybook/tests',
    'apps/storybook/.storybook',
  ];
  const sources = dirs.flatMap((dir) =>
    readdirSync(path.join(root, dir), { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.(ts|tsx|mjs)$/.test(file))
      .map((file) => path.join(dir, file)),
  );
  const loads = /\?raw|import\.meta\.glob|readFileSync|\bread\(|new URL\(/;
  const found: { from: string; reads: string }[] = [];
  for (const from of sources) {
    // This file names the paths in its own cases.
    if (from.endsWith('ci-scope.spec.ts')) continue;
    for (const line of readFileSync(path.join(root, from), 'utf8').split('\n')) {
      if (!loads.test(line)) continue;
      for (const [, literal] of line.matchAll(/['"`]([^'"`\s]+\.md)(?:\?raw)?['"`]/g)) {
        // A path that starts ./ or ../ is relative to the file; anything else, to the repo root.
        const resolved = /^\.\.?\//.test(literal) ? path.join(path.dirname(from), literal) : literal;
        // A glob stands for any one folder.
        found.push({ from, reads: path.normalize(resolved).replaceAll('*', 'Any') });
      }
    }
  }
  // If the search finds nothing it has stopped working, not found a clean repo.
  expect(found.length, 'Markdown reads found in the code').toBeGreaterThanOrEqual(4);
  for (const { from, reads } of found) {
    expect(scope([reads]).docs_only, `${from} reads ${reads}, so a change to it must not skip Verify`).toBe(false);
  }
});
