import { expect, test } from '@playwright/test';

import { gotoStory, tabTo } from './helpers';

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

/**
 * §5 — forced colours (Windows high contrast) removes backgrounds, so a row
 * whose state is shown by its tint alone has no edge there. A failed row
 * draws a 1px outline instead, inside itself so the content keeps its x.
 * When it is open, the outline moves to the wrapper, so the error sits inside
 * the same edge as its row, and the row draws none of its own: one edge, not
 * two. Every other row draws nothing. An agent-proposed row keeps its rail,
 * because forced colours keep borders.
 *
 * Until 2026-10-29 an open failed row had no edge at all in forced colours
 * (docs/site.md, "For the library, not fixed here").
 */
const edgeCases = [
  { story: 'product-runlogrow--with-detail', failedOpen: true },
  { story: 'product-runlogrow--run-log', failedOpen: false },
] as const;

for (const c of edgeCases) {
  test(`in forced colours, a failed row draws one 1px edge, others none — ${c.story}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, c.story);
    const g = await page.evaluate(() => {
      // No outline is `null`: Chrome reports the `medium` width (3px) when
      // the style is `none`, so the width alone says nothing.
      const outline = (el: Element) => {
        const s = getComputedStyle(el);
        return s.outlineStyle === 'none'
          ? null
          : { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
      };
      return Array.from(document.querySelectorAll('[data-slot="run-log-row"]')).map((wrap) => {
        const row = wrap.querySelector<HTMLElement>('[data-status]')!;
        return {
          status: row.dataset.status!,
          open: wrap.querySelector('[data-slot="run-log-detail"]') !== null,
          wrap: outline(wrap),
          row: outline(row),
          rail: getComputedStyle(row).borderLeftWidth,
        };
      });
    });

    const none = null;
    const edge = { style: 'solid', width: '1px', offset: '-1px' };
    const failed = g.filter((r) => r.status === 'failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].open).toBe(c.failedOpen);
    for (const r of g) {
      const isFailed = r.status === 'failed';
      expect(r.wrap, `${r.status}: wrapper`).toEqual(isFailed && r.open ? edge : none);
      expect(r.row, `${r.status}: row`).toEqual(isFailed && !r.open ? edge : none);
      if (r.status === 'agent-proposed') expect(r.rail, 'agent rail survives').toBe('2px');
    }

    // The open row gives its edge to the wrapper with forced-colors:outline-none,
    // which must not take its focus ring too: the ring still draws, inset.
    if (c.failedOpen) {
      // The row's button; the StatusBadge inside it carries data-status too.
      const row = page.locator('button[data-status="failed"]');
      expect(await tabTo(page, row)).toBe(true);
      expect(
        await row.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.outlineStyle, s.outlineWidth, s.outlineOffset];
        }),
      ).toEqual(['solid', '2px', '-2px']);
    }
  });
}
