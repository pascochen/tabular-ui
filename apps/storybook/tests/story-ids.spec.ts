import { expect, test } from '@playwright/test';

/**
 * A product story's ID outlives its place in the sidebar.
 *
 * Storybook derives a story's ID from its title, and the ID is everything
 * else: the URL people share, every `gotoStory` in these specs, the site's
 * "Storybook" link (docs/site.md) and, through the story names, the visual
 * baselines. When the product stories moved into groups by job (2026-11-17),
 * each kept its old ID with CSF's `id`. This holds the pair, and the order
 * the sidebar shows the groups in, which `preview.tsx` must write inline.
 */

/** docs/components.md's product groups, in its order. */
const productGroups = ['Data display', 'Evidence', 'Status', 'Controls', 'Agent', 'Chat', 'Shell'];

type IndexEntry = { id: string; title: string; importPath: string };

test('every product story sits in a group and keeps its ID', async ({ request }) => {
  const entries = Object.values(
    ((await (await request.get('/index.json')).json()) as { entries: Record<string, IndexEntry> }).entries,
  );
  const product = entries.filter((e) => e.importPath.includes('/components/product/'));
  expect(product.length).toBeGreaterThan(0);

  for (const entry of product) {
    const folder = entry.importPath.split('/components/product/')[1].split('/')[0];
    expect(entry.title, entry.importPath).toMatch(new RegExp(`^Product/[^/]+/${folder}$`));
    expect(productGroups, entry.title).toContain(entry.title.split('/')[1]);
    expect(entry.id.split('--')[0], entry.title).toBe(`product-${folder.toLowerCase()}`);
  }
});

test('the sidebar shows the sections, then the product groups, in order', async ({ page }) => {
  await page.goto('/?path=/docs/product-field--docs');
  const nodes = page.locator(
    '#storybook-explorer-tree [data-nodetype="root"], #storybook-explorer-tree [data-nodetype="group"]',
  );
  await expect(nodes.first()).toBeVisible();
  const labels = (await nodes.allTextContents()).map((t) => t.trim());
  expect(labels).toEqual(['Design System', 'Foundational', 'Product', ...productGroups, 'Lib']);
});
