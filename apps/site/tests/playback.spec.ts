import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

/** The specimens' playback and the hero's choices (docs/site.md §6, D6). */

const kasane = JSON.parse(readFileSync(new URL('../data/kasane.json', import.meta.url), 'utf8')) as {
  duplicatePayment: { nextJournalId: string; entries: string[] };
};
const journalId = kasane.duplicatePayment.nextJournalId;
const reversed = kasane.duplicatePayment.entries.at(-1)!;

/** The page is prerendered, so wait for React before pressing anything. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

const hero = (page: Page) => page.locator('section').first();
const status = (page: Page) => hero(page).getByRole('status');

test.describe('the hero', () => {
  test('rests on the proposal, and Post entry posts it', async ({ page }) => {
    await open(page, '/');
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    await expect(hero(page).getByText('Run log row is written here after Post.')).toBeVisible();

    await hero(page).getByRole('button', { name: 'Post entry' }).click();

    await expect(hero(page).getByText('AI · Posted')).toBeVisible();
    await expect(hero(page).getByText('posted by you')).toBeVisible();
    await expect(hero(page).getByRole('button', { name: 'Post entry' })).toHaveCount(0);
    await expect(hero(page).getByText(journalId, { exact: true })).toHaveCount(2); // on the entry, and its run log row
    await expect(status(page)).toHaveText(`Posted as ${journalId}.`);
    // Focus moves to what replaced the pressed button, never to the page.
    await expect(hero(page).getByRole('button', { name: 'Replay the hero’s run' })).toBeFocused();
  });

  test('Replay plays the run back to the waiting proposal, and hands focus to Post entry', async ({ page }) => {
    await open(page, '/');
    await hero(page).getByRole('button', { name: 'Post entry' }).click();
    await hero(page).getByRole('button', { name: 'Replay the hero’s run' }).click();
    // Mid-run, the content is busy, so a screen reader doesn't read a half-built frame.
    await expect(hero(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(hero(page).getByRole('button', { name: 'Post entry' })).toBeFocused({ timeout: 6000 });
    await expect(hero(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    await expect(status(page)).toHaveText('Awaiting review.');
  });

  test('Don’t post declines it, and nothing reaches the books', async ({ page }) => {
    await open(page, '/');
    await hero(page).getByRole('button', { name: 'Don’t post' }).click();
    await expect(hero(page).getByText('AI · Not posted')).toBeVisible();
    await expect(hero(page).getByText('declined by you')).toBeVisible();
    await expect(hero(page).getByText(journalId)).toHaveCount(0);
    await expect(hero(page).getByText(reversed).last()).toBeVisible();
    await expect(status(page)).toHaveText('Not posted.');
  });

  test('Edit entry changes the memo and period, and the proposal still waits', async ({ page }) => {
    await open(page, '/');
    await hero(page).getByRole('button', { name: 'Edit entry' }).click();
    const period = hero(page).getByLabel('Period');
    await expect(period).toBeFocused();
    await period.fill('2026-11');
    await hero(page).getByLabel('Memo').fill('Reverse the duplicate MFL invoice');
    await hero(page).getByRole('button', { name: 'Done' }).click();
    await expect(hero(page).getByText('Reverse the duplicate MFL invoice')).toBeVisible();
    await expect(hero(page).getByText('period 2026-11')).toBeVisible();
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    await expect(hero(page).getByRole('button', { name: 'Edit entry' })).toBeFocused();
  });
});

test.describe('the cards', () => {
  const card = (page: Page, name: string) => page.locator(`#${name}`);

  test('a card below the first screen rewinds unseen and plays to rest when it scrolls in', async ({ page }) => {
    await open(page, '/components');
    const badges = card(page, 'status-badge').locator('[data-slot="badge"], li');
    // Rewound while out of view: only the first badge.
    await expect(card(page, 'status-badge').getByRole('listitem')).toHaveCount(1);
    await card(page, 'status-badge').scrollIntoViewIfNeeded();
    await expect(card(page, 'status-badge').getByRole('listitem')).toHaveCount(9, { timeout: 6000 });
    await expect(badges.first()).toBeVisible();
  });

  test('Replay replays a card and says so once', async ({ page }) => {
    await open(page, '/components');
    const plan = card(page, 'agent-plan');
    await plan.scrollIntoViewIfNeeded();
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeVisible({ timeout: 6000 });
    await plan.getByRole('button', { name: 'Replay Agent plan' }).click();
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeDisabled();
    await expect(plan.getByRole('status')).toHaveText('Agent plan replayed.', { timeout: 6000 });
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeEnabled();
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every card stays at rest, and nothing animates', async ({ page }) => {
    await open(page, '/components');
    await expect(page.locator('#status-badge').getByRole('listitem')).toHaveCount(9);
    await expect(page.locator('#run-log-row').getByText('No header row', { exact: false })).toBeVisible();
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
  });

  test('Replay jumps straight to rest', async ({ page }) => {
    await open(page, '/');
    await hero(page).getByRole('button', { name: 'Post entry' }).click();
    await hero(page).getByRole('button', { name: 'Replay the hero’s run' }).click();
    await expect(hero(page).getByRole('button', { name: 'Post entry' })).toBeFocused();
    await expect(hero(page).locator('[aria-busy="true"]')).toHaveCount(0);
  });
});
