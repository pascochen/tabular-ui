import { expect, test } from '@playwright/test';

import { gotoStory } from './helpers';

/**
 * §10 items that a grep cannot settle, because they are about what the
 * browser renders rather than what the source says.
 */

/**
 * §0 rule 6 — every figure column carries `tabular-nums`. The check that
 * matters is a variance column with mixed-width figures: if the glyphs are
 * proportional, "+18.2%" and "-4.7%" will not align and the misalignment is
 * the correctness hazard, not the aesthetic one.
 */
test('numeric cells render tabular figures, and the column aligns', async ({ page }) => {
  await gotoStory(page, 'product-datatable--default');

  const cells = await page.evaluate(() => {
    const out: { text: string; variant: string; align: string; right: number }[] = [];
    for (const td of Array.from(document.querySelectorAll('td'))) {
      if (!td.className.includes('tabular-nums')) continue;
      const s = getComputedStyle(td);
      out.push({
        text: td.textContent ?? '',
        variant: s.fontVariantNumeric,
        align: s.textAlign,
        right: +td.getBoundingClientRect().right.toFixed(1),
      });
    }
    return out;
  });

  expect(cells.length, 'expected numeric cells in the table').toBeGreaterThan(5);
  for (const c of cells) {
    expect(c.variant, `"${c.text}" must be tabular`).toContain('tabular-nums');
    expect(c.align, `"${c.text}" must be right-aligned`).toBe('right');
  }

  // Mixed-width figures in one column must share a right edge exactly.
  const byColumn = new Map<number, string[]>();
  for (const c of cells) {
    const k = Math.round(c.right);
    byColumn.set(k, [...(byColumn.get(k) ?? []), c.text]);
  }
  const widest = [...byColumn.values()].sort((a, b) => b.length - a.length)[0];
  expect(widest.length, 'a figure column should share one right edge').toBeGreaterThan(3);
  expect(new Set(widest.map((t) => t.length)).size, 'column should contain mixed-width figures').toBeGreaterThan(1);
});

/**
 * §8.2 / §8.3 — the serif belongs to the metric tier (--font-display) and to
 * h1–h6 (--font-heading), and nothing else. Detected by the computed family,
 * since the display tier no longer carries a variation setting. Each story
 * must also show the serif somewhere it belongs, or a stack that silently
 * fell back to the sans would pass with nothing to check.
 */
test('the serif appears only at the metric tier and in headings', async ({ page }) => {
  const stories: [string, boolean][] = [
    ['product-metrictile--sizes', true],
    ['product-appshell--expanded', true],
    ['product-datatable--default', false],
    ['foundational-button--variants', false],
  ];
  for (const [id, expectSerif] of stories) {
    await gotoStory(page, id);
    const { offenders, serifCount } = await page.evaluate(() => {
      const bad: string[] = [];
      let count = 0;
      // The story root only: Storybook's own (hidden) error page has an <h1>.
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('#storybook-root *'))) {
        if (el.children.length > 0 || !el.textContent?.trim()) continue; // leaf nodes carry the text
        const s = getComputedStyle(el);
        if (!s.fontFamily.startsWith('"Source Serif 4 Variable"')) continue;
        count++;
        const size = parseFloat(s.fontSize);
        if (size < 24 && !el.closest('h1, h2, h3, h4, h5, h6')) bad.push(`${size}px: ${el.textContent.slice(0, 20)}`);
      }
      return { offenders: bad, serifCount: count };
    });
    expect(offenders, `serif outside the metric tier and headings in ${id}`).toEqual([]);
    if (expectSerif) expect(serifCount, `no serif text rendered in ${id}`).toBeGreaterThan(0);
  }
});

/**
 * §8.3 / §8.4 — every family loads under its `Variable` name, roman and
 * italic, and Source Serif 4's files carry the opsz axis. Two silent
 * failures this guards: a stack naming only the plain family falls back to
 * the system face, and the package's default entry point ships wght-only
 * files, which leaves font-optical-sizing with nothing to drive. Both render
 * without an error.
 */
test('fonts load under their Variable names, and the serif carries opsz', async ({ page }) => {
  await gotoStory(page, 'product-metrictile--sizes');
  const result = await page.evaluate(async () => {
    const families = ['Source Sans 3 Variable', 'Source Serif 4 Variable', 'Source Code Pro Variable'];
    for (const f of families) {
      await document.fonts.load(`16px "${f}"`, 'a');
      await document.fonts.load(`italic 16px "${f}"`, 'a');
    }
    const loaded = Array.from(document.fonts)
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replace(/"/g, '')} ${f.style}`);
    const width = (opsz: number) => {
      const s = document.createElement('span');
      s.textContent = 'Hamburgefonstiv';
      s.style.cssText = `position:absolute;white-space:pre;font:600 32px "Source Serif 4 Variable";font-variation-settings:'opsz' ${opsz}`;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    return {
      loaded: [...new Set(loaded)],
      body: getComputedStyle(document.body).fontFamily,
      opszSmall: width(8),
      opszLarge: width(60),
    };
  });
  for (const f of ['Source Sans 3 Variable', 'Source Serif 4 Variable', 'Source Code Pro Variable']) {
    expect(result.loaded, `${f} roman`).toContain(`${f} normal`);
    expect(result.loaded, `${f} italic`).toContain(`${f} italic`);
  }
  expect(result.body.startsWith('"Source Sans 3 Variable"'), result.body).toBe(true);
  // 288 against 232px when the axis is present; equal when it is not.
  expect(result.opszSmall - result.opszLarge, 'opsz 8 and 60 render the same width').toBeGreaterThan(20);
});

/**
 * §7.7 — status badges are not pills. Down a status column, square badges form
 * a clean vertical left edge; full-radius pills scallop it.
 */
test('status badges keep --radius-xs down a column', async ({ page }) => {
  await gotoStory(page, 'foundational-badge--status-column');
  const radii = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-slot="badge"]')).map((b) => getComputedStyle(b).borderTopLeftRadius),
  );
  expect(radii.length).toBeGreaterThan(3);
  for (const r of radii) expect(r, 'status badge must be --radius-xs (0px since 2026-10-16)').toBe('0px');
});

/**
 * §7.3 "Frame tier": only `size="page"` spends --pad-frame-empty. The other
 * sizes keep 16px; they borrowed --gap-section until it rose to 32px, and a
 * regression there would silently double every empty state in a panel.
 */
test('EmptyState takes frame air only at size="page"', async ({ page }) => {
  const padding = async (story: string) => {
    await gotoStory(page, story);
    return page
      .locator('[data-slot="empty-state"]')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { top: cs.paddingTop, bottom: cs.paddingBottom, left: cs.paddingLeft };
      });
  };
  expect(await padding('product-emptystate--page')).toEqual({ top: '64px', bottom: '64px', left: '16px' });
  expect(await padding('product-emptystate--default')).toEqual({ top: '16px', bottom: '16px', left: '16px' });
  expect(await padding('product-emptystate--small')).toEqual({ top: '16px', bottom: '16px', left: '16px' });
});

/**
 * §7.4 --pad-popup-list and the 24px label row. Boxes, not glyphs: every box
 * edge inside a popup lands on the 4px grid, measured from the inside of the
 * border. Before 2026-10-08 the inset was 2px and the label row 18px, so the
 * group label sat nearer the border than its own rows.
 */
test('popup rows sit on the 4px grid under a 24px label row', async ({ page }) => {
  await gotoStory(page, 'foundational-menu--rich');
  await page.getByRole('button', { name: 'Model actions' }).click();
  const popup = page.locator('[data-slot="menu-content"]');
  await expect(popup).toBeVisible();
  // Polled: the popup animates in, and its rows move with it.
  await expect.poll(() => popup.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');

  const g = await popup.evaluate((el) => {
    const top = el.getBoundingClientRect().top + parseFloat(getComputedStyle(el).borderTopWidth);
    const rows = Array.from(
      el.querySelectorAll('[data-slot="menu-label"], [role="menuitem"], [data-slot="menu-separator"]'),
    ).map((r) => {
      const b = r.getBoundingClientRect();
      return {
        slot: (r as HTMLElement).dataset.slot ?? r.getAttribute('role'),
        top: b.top - top,
        bottom: b.bottom - top,
      };
    });
    return { padding: getComputedStyle(el).padding, rows };
  });

  expect(g.padding).toBe('4px');
  const [label, first, second, separator, after] = g.rows;
  expect(label).toMatchObject({ slot: 'menu-label', top: 4, bottom: 28 });
  expect(first).toMatchObject({ top: 28, bottom: 56 });
  expect(second).toMatchObject({ top: 56, bottom: 84 });
  // 4px either side of the 1px rule, the same inset as the popup's edge.
  expect(separator.top - second.bottom).toBe(4);
  expect(after.top - separator.bottom).toBe(4);
});

/**
 * §5 — an agent-proposed row carries the rail AgentBlock draws: 2px of solid
 * --color-text-agent. Checked where it paints, in all three components that
 * apply runStatusRowTreatment, because each fails differently. A div row's
 * border takes 2px of its width, so its content drifted 2px right of its
 * neighbours. A DataTable row drew nothing: a border-separate table paints no
 * border on a <tr>, though the <tr>'s computed style still read 2px. So the
 * rail is asserted on the element that paints it, and the content's x
 * against a plain row's.
 */
const railCases = [
  {
    story: 'product-runlogrow--run-log',
    rows: '#storybook-root div[data-status]:not([data-slot])',
  },
  {
    story: 'product-datatable--default',
    rows: 'tbody tr[data-row-id]',
  },
  {
    story: 'product-attachmentrow--in-agent-block',
    rows: '[data-slot="attachment-row"]',
  },
];

for (const theme of ['dark', 'light'] as const) {
  for (const c of railCases) {
    test(`an agent-proposed row draws the solid agent rail, content in line — ${c.story} · ${theme}`, async ({
      page,
    }) => {
      await gotoStory(page, c.story, theme);
      const result = await page.evaluate((c) => {
        const agentColor = (() => {
          const probe = document.createElement('div');
          probe.style.color = 'var(--color-text-agent)';
          document.body.append(probe);
          const value = getComputedStyle(probe).color;
          probe.remove();
          return value;
        })();
        const rows = Array.from(document.querySelectorAll<HTMLElement>(c.rows)).filter((r) => r.offsetHeight > 0);
        // Where the row's content starts: a table cell's text, or a div row's
        // first child (RunLogRow's caret, AttachmentRow's file glyph).
        const textX = (row: HTMLElement) => {
          const td = row.querySelector('td');
          if (td) {
            const range = document.createRange();
            range.selectNodeContents(td);
            return range.getBoundingClientRect().left - row.getBoundingClientRect().left;
          }
          return row.firstElementChild!.getBoundingClientRect().left - row.getBoundingClientRect().left;
        };
        const agent = rows.find((r) => r.className.includes('bg-bg-agent'))!;
        const plain = rows.find((r) => !r.className.includes('bg-bg-'));
        const railEl = c.story.includes('datatable') ? agent.querySelector('td')! : agent;
        const s = getComputedStyle(railEl);
        return {
          width: s.borderLeftWidth,
          style: s.borderLeftStyle,
          color: s.borderLeftColor,
          agentColor,
          agentX: textX(agent),
          plainX: plain ? textX(plain) : null,
          padCellX: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad-cell-x')),
        };
      }, c);
      expect(result.width).toBe('2px');
      expect(result.style).toBe('solid');
      expect(result.color).toBe(result.agentColor);
      // In line with a plain row; AttachmentRow's story has none, so against
      // the padding a plain row would have.
      expect(result.agentX).toBeCloseTo(result.plainX ?? result.padCellX, 1);
    });
  }
}
