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
