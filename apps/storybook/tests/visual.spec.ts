import { globSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * Visual regression: every story, in both modes, compared pixel for pixel
 * against an approved screenshot committed under `visual.spec.ts-snapshots/`.
 *
 * The rest of the suite checks rules: a token, a contrast ratio, a ring that
 * isn't clipped. None of it sees a palette or spacing change that shifts a
 * component without breaking a rule, and the failure log is mostly that kind
 * of change. This is the check that does.
 *
 * Baselines are Linux-only. Fonts rasterise differently on macOS, so a Mac
 * screenshot never matches a Linux one, and CI is Linux. The spec skips
 * everywhere else. When a change is deliberate, declare the story file in the
 * PR description and CI commits the new screenshots itself
 * (scripts/visual-gate.mjs). Otherwise regenerate the baselines on Linux with
 * the "Update visual baselines" workflow; it commits them, and the PR's Verify
 * run then waits for approval on the PR page. See README "Visual changes".
 */

// TUI_VISUAL_ANY_OS=1 runs it anyway, for debugging the spec itself. The
// screenshots it writes carry a -darwin suffix and are gitignored.
test.skip(
  process.platform !== 'linux' && !process.env.TUI_VISUAL_ANY_OS,
  'Visual baselines are Linux-only. They run in CI; see CONTRIBUTING.md, "Visual changes".',
);

// One viewport for every story: laptop width (preview.tsx's `laptop`).
// Loading a story's iframe directly bypasses the viewport toolbar, so a
// story's own `globals.viewport` does not apply here.
test.use({ viewport: { width: 1280, height: 800 } });

type IndexEntry = { id: string; type: 'story' | 'docs'; importPath: string };

// Stories live in the library, beside their components. Storybook indexes
// them by their path from this app (`../../packages/ui/src/...`).
const ui = path.resolve(import.meta.dirname, '../../../packages/ui');
const storyFiles = globSync('src/**/*.stories.tsx', { cwd: ui }).sort();
const themes = ['dark', 'light'] as const;

let index: IndexEntry[] | undefined;

for (const file of storyFiles) {
  for (const theme of themes) {
    test(
      `${file.replace(/^src\//, '').replace(/\.stories\.tsx$/, '')} · ${theme}`,
      { tag: '@visual' },
      async ({ page, request }) => {
        // Story ids come from Storybook itself, not from parsing the file, so a
        // renamed export or a custom `name` cannot drift from what is tested.
        index ??= Object.values(
          ((await (await request.get('/index.json')).json()) as { entries: Record<string, IndexEntry> }).entries,
        );
        const stories = index.filter((e) => e.type === 'story' && e.importPath === `../../packages/ui/${file}`);
        expect(stories.length, `no stories indexed for ${file}`).toBeGreaterThan(0);
        // One test covers a whole story file, so its budget scales with the
        // file. A fixed 30s timed out AppShell's eleven stories on CI.
        test.setTimeout(30_000 + stories.length * 15_000);

        for (const { id } of stories) {
          await gotoStory(page, id, theme);
          // A story's play function can still be running after first paint:
          // ChatComposer's type whole messages. Screenshotting then races the
          // typing, and the baseline records whichever frame it caught, so
          // the same story failed by 2px on one run and passed on the next.
          // Wait for Storybook's render to reach `finished` (after play and
          // afterEach). `currentRender.phase` is internal to Storybook's
          // preview: if an upgrade renames it, this times out, loudly.
          await page.waitForFunction(() => {
            const preview = (window as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
              .__STORYBOOK_PREVIEW__;
            return ['finished', 'errored', 'aborted'].includes(preview?.currentRender?.phase ?? '');
          });
          // Fonts are self-hosted and load after first paint; images (Avatar)
          // after that. Screenshot only once both have settled. Not
          // `networkidle`: it idles 500ms per story whatever the page does,
          // three of the four and a half minutes a one-worker run took.
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
          await page.mouse.move(0, 0);

          // Soft, so one changed story doesn't hide the rest of the file.
          await expect.soft(page).toHaveScreenshot(`${id}--${theme}.png`, {
            fullPage: true,
            animations: 'disabled',
            caret: 'hide',
            // Exact match. Playwright's default per-pixel tolerance (0.2) is
            // wider than this palette's own steps: an olive-800 border on the
            // olive-950 canvas (the palette before Riso Ledger) sat inside it,
            // so a 6px → 4px radius change
            // passed. Rendering is deterministic on one platform (two runs,
            // 342 identical screenshots), so there is nothing to tolerate.
            threshold: 0,
          });
        }
      },
    );
  }
}
