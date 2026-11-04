import { expect, test, type Locator, type Page } from '@playwright/test';
import type { Icon, IconWeight } from '@phosphor-icons/react';
import { CheckCircleIcon, ListBulletsIcon, TreeStructureIcon } from '@phosphor-icons/react/ssr';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { gotoStory, rgba, token } from './helpers';

/**
 * Tabs — behaviour and the active indicator.
 *
 * Behaviour (roles, roving focus, manual activation, wrapping, Home/End, the
 * orientation's arrow keys, disabled tabs) comes from Base UI, and is pinned
 * here so an upgrade or a wrapper that drops a prop cannot lose it silently.
 *
 * The indicator is ours, and it has broken silently before: a rule keyed on
 * the wrong state attribute, and the zero-specificity `data-active:`
 * shorthand, each left the active tab with no indicator and no text step.
 * Screenshots only see a story's first render, so these tests move the
 * selection and check that the indicator and the text step follow it, in
 * both modes, read from tokens.
 */

const tab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });

/** The accessible name of the focused element, or its role when it has none. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('role') === 'tab' ? el.textContent?.trim() : el?.getAttribute('role');
  });

/** The tab's `::after`, which draws the indicator. */
const indicator = (t: Locator) =>
  t.evaluate((el) => {
    const s = getComputedStyle(el, '::after');
    return {
      opacity: s.opacity,
      color: s.backgroundColor,
      width: s.width,
      height: s.height,
      bottom: s.bottom,
      right: s.right,
    };
  });

/**
 * A tab's computed colour once it has settled. Polled, not read once:
 * controlBase transitions colour, so a read straight after the selection
 * moves catches the fade partway.
 */
const settlesTo = (page: Page, t: Locator, prop: 'color' | 'backgroundColor', expected: number[], message?: string) =>
  expect
    .poll(async () => rgba(page, await t.evaluate((el, p) => getComputedStyle(el)[p], prop)), { message })
    .toEqual(expected);

test.describe('Tabs — behaviour', () => {
  test('a tablist of tabs, and the one visible panel is named by its tab', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--default');
    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(tab(page, 'Runs')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Runs');
  });

  test('a click selects a tab and shows only its panel', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--default');
    await tab(page, 'Lineage').click();
    await expect(tab(page, 'Lineage')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Runs')).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Lineage');
    await expect(page.getByRole('tabpanel')).toContainText('14 downstream models');
  });

  test('the strip is one tab stop: Tab lands on the selected tab, then on its panel', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--default');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toBe('Runs');
    await page.keyboard.press('Tab');
    expect(await focused(page), 'the next stop is the panel, not the next tab').toBe('tabpanel');
    await page.keyboard.press('Shift+Tab');
    expect(await focused(page)).toBe('Runs');
  });

  test('arrows move focus without selecting; Enter and Space select', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--default');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page)).toBe('Lineage');
    // Manual activation: a panel that runs a query should not load because
    // focus passed over its tab on the way somewhere else.
    await expect(tab(page, 'Runs')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(tab(page, 'Lineage')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(tab(page, 'Tests')).toHaveAttribute('aria-selected', 'true');
  });

  test('arrows wrap at the ends, and Home and End jump to them', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--default');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowLeft');
    expect(await focused(page), 'Left from the first wraps to the last').toBe('Tests');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page), 'Right from the last wraps to the first').toBe('Runs');
    await page.keyboard.press('End');
    expect(await focused(page)).toBe('Tests');
    await page.keyboard.press('Home');
    expect(await focused(page)).toBe('Runs');
  });

  test('vertical tabs say so, and follow Up and Down rather than Left and Right', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--vertical');
    await expect(page.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toBe('Lineage');
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toBe('Runs');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page), 'Right does nothing in a vertical strip').toBe('Runs');
  });

  test('a disabled tab can be reached, so it is announced, but never selected', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--disabled');
    const lineage = tab(page, 'Lineage');
    await expect(lineage).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page)).toBe('Lineage');
    await page.keyboard.press('Enter');
    await expect(tab(page, 'Runs')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page), 'and the arrows carry on past it').toBe('Tests');
    await lineage.click({ force: true });
    await expect(tab(page, 'Runs')).toHaveAttribute('aria-selected', 'true');
  });
});

for (const mode of ['dark', 'light'] as const) {
  test.describe(`Tabs — the indicator follows the selection in ${mode}`, () => {
    test('line: a 2px interactive indicator on the rule, and the text step, move with it', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--default', mode);
      const list = page.getByRole('tablist');
      const names = ['Runs', 'Lineage', 'Tests'];
      const boxesBefore = await Promise.all(names.map((n) => tab(page, n).boundingBox()));

      // Selected by keyboard, then by pointer, so neither path can skip the state.
      await page.keyboard.press('Tab');
      await page.keyboard.press('End');
      await page.keyboard.press('Enter');
      await tab(page, 'Lineage').click();

      const fill = await rgba(page, await token(page, '--color-fill-interactive'));
      const primary = await rgba(page, await token(page, '--color-text-primary'));
      const secondary = await rgba(page, await token(page, '--color-text-secondary'));
      const rule = await list.evaluate((el) => ({
        width: parseFloat(getComputedStyle(el).borderBottomWidth),
        bottom: el.getBoundingClientRect().bottom,
      }));

      for (const name of names) {
        const t = tab(page, name);
        const ind = await indicator(t);
        if (name === 'Lineage') {
          expect(ind.opacity, 'active tab shows the indicator').toBe('1');
          expect(await rgba(page, ind.color)).toEqual(fill);
          expect(ind.height).toBe(await token(page, '--border-width-2'));
          // Sits on the list's rule rather than above it, so the row never
          // shifts when the selection moves.
          const tabBottom = (await t.boundingBox())!.y + (await t.boundingBox())!.height;
          expect(rule.width, 'the list draws a rule').toBeGreaterThan(0);
          expect(tabBottom - parseFloat(ind.bottom), "indicator's bottom edge is the rule's").toBeCloseTo(
            rule.bottom,
            1,
          );
          await settlesTo(page, t, 'color', primary, 'active tab takes the primary text step');
        } else {
          expect(ind.opacity, `${name} shows no indicator`).toBe('0');
          await settlesTo(page, t, 'color', secondary, `${name} is secondary`);
        }
      }

      const boxesAfter = await Promise.all(names.map((n) => tab(page, n).boundingBox()));
      expect(boxesAfter, 'no tab moves when the selection does').toEqual(boxesBefore);
    });

    test('vertical: the indicator moves to the inline edge, on the rule', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--vertical', mode);
      await tab(page, 'Tests').click();
      const t = tab(page, 'Tests');
      const ind = await indicator(t);
      expect(ind.opacity).toBe('1');
      expect(ind.width).toBe(await token(page, '--border-width-2'));
      const listRight = await page.getByRole('tablist').evaluate((el) => el.getBoundingClientRect().right);
      const box = (await t.boundingBox())!;
      expect(box.x + box.width - parseFloat(ind.right), "indicator's outer edge is the rule's").toBeCloseTo(
        listRight,
        1,
      );
      expect((await indicator(tab(page, 'Runs'))).opacity).toBe('0');
    });

    test('segmented: no indicator; the selected tab lifts onto the raised surface', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--segmented', mode);
      await tab(page, 'Chart').click();
      const raised = await rgba(page, await token(page, '--color-surface-raised'));
      for (const name of ['Table', 'Chart', 'JSON']) {
        const t = tab(page, name);
        expect((await indicator(t)).opacity, `${name}: the shape change is the signal`).toBe('0');
        if (name === 'Chart') await settlesTo(page, t, 'backgroundColor', raised, 'Chart lifts');
        else await settlesTo(page, t, 'backgroundColor', [0, 0, 0, 0], `${name} has no ground of its own`);
      }
    });

    test('a disabled tab recedes like every other disabled control', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--disabled', mode);
      const style = (name: string) =>
        tab(page, name).evaluate((el) => {
          const s = getComputedStyle(el);
          return { opacity: s.opacity, pointerEvents: s.pointerEvents };
        });
      // controlBase fades a disabled control as a whole. Base UI keeps a
      // disabled tab focusable, so it carries aria-disabled and data-disabled
      // rather than the native attribute that `disabled:` matches. The fade
      // reaches it through controlBase's data-[disabled] rule, not a local one.
      expect(await style('Lineage')).toEqual({ opacity: '0.5', pointerEvents: 'none' });
      expect((await style('Tests')).opacity, 'an enabled inactive tab does not').toBe('1');
    });
  });
}

/** A bordered item's ::after, which draws the hover and press overlay. */
const overlay = (t: Locator) => t.evaluate((el) => getComputedStyle(el, '::after').backgroundColor);

for (const mode of ['dark', 'light'] as const) {
  test.describe(`Tabs — bordered, in ${mode}`, () => {
    /** The same appearance on two elements: a tab, and a link with aria-current. */
    const surfaces = [
      {
        name: 'tabs',
        story: 'foundational-tabs--bordered',
        selected: (page: Page) => tab(page, 'Runs'),
        other: (page: Page) => tab(page, 'Lineage'),
        toOther: 'ArrowRight',
      },
      {
        name: 'links',
        story: 'foundational-tabs--bordered-links',
        selected: (page: Page) => page.getByRole('link', { name: 'Runs' }),
        other: (page: Page) => page.getByRole('link', { name: 'Lineage' }),
        toOther: 'Tab',
      },
    ];

    for (const { name, story, selected, other, toOther } of surfaces) {
      test(`${name}: the frame paints along the strip's edge, and the selected fill covers it`, async ({ page }) => {
        await gotoStory(page, story, mode);
        const list = page.locator('[data-slot="tabs-list"], nav ul');
        const box = (await list.boundingBox())!;
        const fill = await rgba(page, await token(page, '--color-fill-interactive'));
        // A computed border isn't a painted one: read the rows of pixels
        // themselves, on both edges. Inset at the ends, so a fractional width
        // can't catch the canvas.
        for (const y of [Math.round(box.y), Math.round(box.y + box.height) - 1]) {
          const row = await page.screenshot({
            clip: { x: Math.ceil(box.x) + 1, y, width: Math.floor(box.width) - 3, height: 1 },
          });
          const colours = await page.evaluate(async (base64) => {
            const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
            const context = new OffscreenCanvas(image.width, 1).getContext('2d')!;
            context.drawImage(image, 0, 0);
            const { data } = context.getImageData(0, 0, image.width, 1);
            const seen = new Set<string>();
            for (let i = 0; i < data.length; i += 4) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
            return [...seen];
          }, row.toString('base64'));
          // Ink under the selected item, then one colour to the end. A line
          // crossing the edge would add a third.
          expect(colours).toHaveLength(2);
          expect(colours[0]).toBe(fill.slice(0, 3).join(','));
        }
      });

      test(`${name}: the list draws a 1px --color-border frame, and an item's border is transparent`, async ({
        page,
      }) => {
        await gotoStory(page, story, mode);
        const border = await rgba(page, await token(page, '--color-border'));
        const list = page.locator('[data-slot="tabs-list"], nav ul');
        const frame = await list.evaluate((el) => {
          const s = getComputedStyle(el, '::before');
          return (['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => ({
            width: s[`border${side}Width`],
            color: s[`border${side}Color`],
          }));
        });
        for (const side of frame) {
          expect(side.width).toBe('1px');
          expect(await rgba(page, side.color)).toEqual(border);
        }
        for (const item of [selected(page), other(page)]) {
          const edge = await item.evaluate((el) => {
            const s = getComputedStyle(el);
            return { width: s.borderTopWidth, color: s.borderTopColor };
          });
          expect(edge.width).toBe('1px');
          expect(await rgba(page, edge.color)).toEqual([0, 0, 0, 0]);
        }
      });

      test(`${name}: the strip is one control tall, and its items reach its edges`, async ({ page }) => {
        await gotoStory(page, story, mode);
        const list = page.locator('[data-slot="tabs-list"], nav ul');
        const listBox = (await list.boundingBox())!;
        const box = (await selected(page).boundingBox())!;
        expect(listBox.height, 'the frame adds no height: the strip is one item tall').toBe(box.height);
        expect(box.y, 'the selected fill reaches the top').toBe(listBox.y);
        expect(box.x, 'and the first item the start').toBe(listBox.x);
        const lastRight = await list.evaluate((el) => {
          const items = [...el.querySelectorAll('[data-slot="tabs-trigger"], a')];
          return items[items.length - 1].getBoundingClientRect().right;
        });
        expect(listBox.x + listBox.width, 'the frame ends with the last item').toBe(lastRight);
      });

      test(`${name}: a label starts where a Button's does, 9px in`, async ({ page }) => {
        await gotoStory(page, story, mode);
        // Button's is 8px of padding and its 1px border, inside the box.
        const inset = await other(page).evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.paddingLeft, s.borderLeftWidth];
        });
        expect(inset).toEqual(['8px', '1px']);
      });

      test(`${name}: the hover overlay reaches the item's edge`, async ({ page }) => {
        await gotoStory(page, story, mode);
        // Over the 1px border, or the selected item would keep a line of plain ink.
        const inset = await selected(page).evaluate((el) => getComputedStyle(el, '::after').left);
        expect(inset).toBe('-1px');
      });

      test(`${name}: selected is the ink fill and its on-colour`, async ({ page }) => {
        await gotoStory(page, story, mode);
        const fill = await rgba(page, await token(page, '--color-fill-interactive'));
        const on = await rgba(page, await token(page, '--color-on-interactive'));
        await settlesTo(page, selected(page), 'backgroundColor', fill);
        await settlesTo(page, selected(page), 'color', on);
        await settlesTo(page, other(page), 'backgroundColor', [0, 0, 0, 0], 'the others have no ground of their own');
      });

      test(`${name}: hover is --color-bg-hover, and its inverse on the selected item`, async ({ page }) => {
        await gotoStory(page, story, mode);
        await other(page).hover();
        await expect
          .poll(async () => rgba(page, await overlay(other(page))))
          .toEqual(await rgba(page, await token(page, '--color-bg-hover')));
        await selected(page).hover();
        await expect
          .poll(async () => rgba(page, await overlay(selected(page))))
          .toEqual(await rgba(page, await token(page, '--color-bg-hover-inverse')));
      });

      test(`${name}: the ring leaves a pixel of the item's ground outside it`, async ({ page }) => {
        await gotoStory(page, story, mode);
        await page.keyboard.press('Tab');
        await expect(selected(page)).toBeFocused();
        const ring = await selected(page).evaluate((el) => {
          const s = getComputedStyle(el);
          return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
        });
        expect(ring).toEqual({ style: 'solid', width: '2px', offset: '-3px' });
      });

      test(`${name}: the ring is paper on ink on the selected item, and --color-ring on the rest`, async ({ page }) => {
        await gotoStory(page, story, mode);
        // Polled: controlBase transitions colour, the outline's included.
        const ringColor = (t: Locator) => t.evaluate((el) => getComputedStyle(el).outlineColor);
        await page.keyboard.press('Tab');
        await expect(selected(page)).toBeFocused();
        // --color-ring on the ink fill is 1.80:1 in light and 1.29:1 in dark.
        await expect
          .poll(async () => rgba(page, await ringColor(selected(page))))
          .toEqual(await rgba(page, await token(page, '--color-on-interactive')));
        await page.keyboard.press(toOther);
        await expect(other(page)).toBeFocused();
        await expect
          .poll(async () => rgba(page, await ringColor(other(page))))
          .toEqual(await rgba(page, await token(page, '--color-ring')));
      });

      test(`${name}: in forced colours the selected item alone keeps a mark`, async ({ page }) => {
        await gotoStory(page, story, mode);
        await page.emulateMedia({ forcedColors: 'active' });
        const decoration = (t: Locator) =>
          t.evaluate((el) => {
            const s = getComputedStyle(el);
            return { line: s.textDecorationLine, thickness: s.textDecorationThickness };
          });
        expect(await decoration(selected(page))).toEqual({ line: 'underline', thickness: '2px' });
        expect((await decoration(other(page))).line).toBe('none');
        expect(
          await other(page).evaluate((el) => getComputedStyle(el).borderTopStyle),
          'every item keeps its edge',
        ).toBe('solid');
        expect(
          await page
            .locator('[data-slot="tabs-list"], nav ul')
            .evaluate((el) => getComputedStyle(el, '::before').borderTopStyle),
          'the frame is a border, so it stays',
        ).toBe('solid');
      });
    }

    test('neighbours touch, with no line between them, and selecting moves nothing', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--bordered', mode);
      const boxes = () => Promise.all(['Runs', 'Lineage', 'Tests'].map((n) => tab(page, n).boundingBox()));
      const before = await boxes();
      for (let i = 1; i < before.length; i++) {
        expect(before[i]!.x, 'each item starts where the one before ends').toBe(
          before[i - 1]!.x + before[i - 1]!.width,
        );
      }
      await tab(page, 'Lineage').click();
      expect(await boxes()).toEqual(before);
    });

    test('vertical: the same frame, with the items stacked and the fill reaching both sides', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--bordered-vertical', mode);
      const list = page.getByRole('tablist');
      const frame = await list.evaluate((el) => {
        const s = getComputedStyle(el, '::before');
        return { right: s.borderRightWidth, bottom: s.borderBottomWidth, color: s.borderRightColor };
      });
      expect([frame.right, frame.bottom]).toEqual(['1px', '1px']);
      expect(await rgba(page, frame.color)).toEqual(await rgba(page, await token(page, '--color-border')));
      const trigger = await tab(page, 'Lineage').evaluate((el) => {
        const s = getComputedStyle(el);
        return { right: s.borderRightWidth, bottom: s.borderBottomWidth };
      });
      expect(trigger).toEqual({ right: '1px', bottom: '1px' });
      const listBox = (await list.boundingBox())!;
      const item = (await tab(page, 'Lineage').boundingBox())!;
      expect(item.x, 'the selected fill reaches the start').toBe(listBox.x);
      expect(item.x + item.width, 'and the end').toBe(listBox.x + listBox.width);
      const boxes = (await Promise.all(['Runs', 'Lineage', 'Tests'].map((n) => tab(page, n).boundingBox()))).map(
        (b) => b!,
      );
      for (let i = 1; i < boxes.length; i++) {
        expect(boxes[i].y).toBe(boxes[i - 1].y + boxes[i - 1].height);
        expect(boxes[i].x).toBe(boxes[0].x);
        expect(boxes[i].width).toBe(boxes[0].width);
      }
    });

    test('size="lg" is --text-lg with its tracking, SemiBold, in a 36px box, on tabs and links', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--bordered-large', mode);
      const expected = {
        fontSize: '16px',
        lineHeight: '24px',
        letterSpacing: '-0.16px',
        fontWeight: '600',
        height: 36,
      };
      for (const item of [tab(page, 'Runs'), page.getByRole('link', { name: 'Color' })]) {
        const measured = await item.evaluate((el) => {
          const s = getComputedStyle(el);
          return {
            fontSize: s.fontSize,
            lineHeight: s.lineHeight,
            letterSpacing: s.letterSpacing,
            fontWeight: s.fontWeight,
            height: el.getBoundingClientRect().height,
          };
        });
        expect(measured).toEqual(expected);
      }
    });

    test('the default size is --text-base in a 32px box', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--bordered', mode);
      const measured = await tab(page, 'Runs').evaluate((el) => {
        const s = getComputedStyle(el);
        return { fontSize: s.fontSize, height: el.getBoundingClientRect().height };
      });
      expect(measured).toEqual({ fontSize: '13px', height: 32 });
    });

    test('the links are real links, in a nav, with no tab roles', async ({ page }) => {
      await gotoStory(page, 'foundational-tabs--bordered-links', mode);
      const nav = page.getByRole('navigation', { name: 'Run views' });
      await expect(nav.getByRole('link')).toHaveCount(3);
      await expect(nav.locator('[aria-current="page"]')).toHaveText('Runs');
      await expect(page.getByRole('tab')).toHaveCount(0);
      await expect(page.getByRole('tablist')).toHaveCount(0);
    });
  });
}

/**
 * §11.2's state table, enforced by TabsTrigger: selected `fill`, disabled
 * `light`, the rest `bold`. Weight is not in the DOM, but Phosphor draws each
 * weight as different path data, so each icon's path is compared with the
 * same icon rendered at the expected weight.
 */
const expectedPath = (icon: Icon, weight: IconWeight) =>
  renderToStaticMarkup(createElement(icon, { weight })).match(/<path d="([^"]+)"/)?.[1];
const iconPath = (page: Page, name: string) => tab(page, name).locator('svg path').first().getAttribute('d');

test.describe('Tabs — icon weight follows §11.2', () => {
  test('selected draws fill, disabled light, the rest bold', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--disabled');
    expect(await iconPath(page, 'Runs'), 'selected').toBe(expectedPath(ListBulletsIcon, 'fill'));
    expect(await iconPath(page, 'Lineage'), 'disabled').toBe(expectedPath(TreeStructureIcon, 'light'));
    expect(await iconPath(page, 'Tests'), 'neither').toBe(expectedPath(CheckCircleIcon, 'bold'));
  });

  test('the fill moves with the selection', async ({ page }) => {
    await gotoStory(page, 'foundational-tabs--with-icons');
    await tab(page, 'Lineage').click();
    await expect.poll(() => iconPath(page, 'Lineage')).toBe(expectedPath(TreeStructureIcon, 'fill'));
    expect(await iconPath(page, 'Runs')).toBe(expectedPath(ListBulletsIcon, 'bold'));
  });
});
