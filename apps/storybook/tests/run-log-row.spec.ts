import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * RunLogRow's open detail draws no rail and starts its text where the row's
 * first content after the caret starts: the badge on an untimed row, the
 * timestamp on a timed one.
 *
 * Until 2026-10-28 the detail drew a 2px --color-border-strong rail, a width
 * §7.8 reserves for the agent rail, the focus ring and the active tab. It sat
 * at the left edge of the caret's 12px box, about 5px left of the chevron,
 * and its text started 2px past that, in line with nothing. Asserted exactly:
 * a transparent border or a 2px rail is geometry, and an inequality lets a
 * drift through (failure log: ContextSwitcherLabel, Switch).
 */
const cases = [
  // As tabularui.com renders it. The agent-proposed row's 2px rail comes off
  // its own left padding, so its badge, and its detail, keep the same x.
  { story: 'product-runlogrow--untimed', open: 2, after: 'badge' },
  { story: 'product-runlogrow--with-detail', open: 1, after: 'timestamp' },
] as const;

for (const theme of ['dark', 'light'] as const) {
  for (const c of cases) {
    test(`an open detail has no rail and starts at the ${c.after}'s x — ${c.story} · ${theme}`, async ({ page }) => {
      await gotoStory(page, c.story, theme);
      const g = await page.evaluate(() => {
        const left = (el: Element) => el.getBoundingClientRect().left;
        return Array.from(document.querySelectorAll('[data-slot="run-log-row"]')).map((wrap) => {
          const row = wrap.querySelector<HTMLElement>('[data-status]')!;
          // The caret is the row's first child; what follows it is the content
          // the detail lines up with.
          const first = row.children[1] as HTMLElement;
          const detail = wrap.querySelector<HTMLElement>('[data-slot="run-log-detail"]');
          let detailX: number | null = null;
          let border: string | null = null;
          if (detail) {
            const range = document.createRange();
            range.selectNodeContents(detail);
            detailX = range.getBoundingClientRect().left;
            border = getComputedStyle(detail).borderLeftWidth;
          }
          return {
            status: row.dataset.status,
            firstText: first.textContent,
            firstX: left(first),
            detailX,
            border,
          };
        });
      });

      const open = g.filter((r) => r.detailX !== null);
      expect(open).toHaveLength(c.open);
      // Every row's first content shares one x, agent-proposed included.
      expect(new Set(g.map((r) => r.firstX)).size).toBe(1);
      for (const r of open) {
        expect(r.border, `${r.status}: no rail`).toBe('0px');
        expect(r.detailX, `${r.status}: detail text x`).toBe(r.firstX);
        if (c.after === 'timestamp') expect(r.firstText).toMatch(/^\d\d:\d\d:\d\d$/);
        else expect(r.firstText).not.toMatch(/\d\d:\d\d/);
      }
      if (c.story.endsWith('untimed')) expect(open.map((r) => r.status)).toContain('agent-proposed');
    });
  }
}
