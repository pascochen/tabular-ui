import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

/** The specimens' playback, the hero teaser, and the Agent block card's choices (docs/site.md §6, D6). */

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
const card = (page: Page, name: string) => page.locator(`#${name}`);

/** The rendered height of an element, to the pixel. */
const height = async (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Math.round(el.getBoundingClientRect().height));

test.describe('the hero', () => {
  test('is a teaser: it rests on the waiting proposal, and offers only Replay', async ({ page }) => {
    await open(page, '/');
    await expect(hero(page).getByText('Did we pay any invoice twice?')).toBeVisible();
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    // No decision to take, and no dashed placeholder (owner, 2026-10-26).
    // The specimen's only button is Replay. (The section's own Demo action is not the specimen's.)
    await expect(hero(page).getByRole('button').filter({ hasNotText: 'Demo' })).toHaveCount(1);
    await expect(hero(page).getByRole('button', { name: 'Replay the hero’s run' })).toBeVisible();
    await expect(hero(page).getByText('Run log row', { exact: false })).toHaveCount(0);
  });

  test('Replay plays the run back to the proposal, at the same height, and says so once', async ({ page }) => {
    await open(page, '/');
    const plate = 'section[aria-labelledby="hero-title"] [data-plate]';
    const atRest = await height(page, plate);
    await hero(page).getByRole('button', { name: 'Replay the hero’s run' }).click();
    // Mid-run, the content is busy, so a screen reader doesn't read a half-built frame.
    await expect(hero(page).locator('[aria-busy="true"]')).toHaveCount(1);
    expect(await height(page, plate)).toBe(atRest);
    await expect(hero(page).getByRole('status')).toHaveText('Awaiting review.', { timeout: 6000 });
    await expect(hero(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(hero(page).getByRole('button', { name: 'Replay the hero’s run' })).toBeFocused();
  });
});

test.describe('the Agent block card', () => {
  const block = (page: Page) => card(page, 'agent-block');

  /** The card plays when it scrolls in; its buttons arrive with the last frame. */
  async function openCard(page: Page) {
    await open(page, '/');
    await block(page).scrollIntoViewIfNeeded();
    await expect(block(page).getByRole('button', { name: 'Post entry' })).toBeVisible({ timeout: 6000 });
  }

  test('rests on the proposal, and Post entry posts it', async ({ page }) => {
    await openCard(page);
    await expect(block(page).getByText('AI · Awaiting review')).toBeVisible();
    await block(page).getByRole('button', { name: 'Post entry' }).click();

    await expect(block(page).getByText('AI · Posted')).toBeVisible();
    await expect(block(page).getByText('posted by you')).toBeVisible();
    await expect(block(page).getByRole('button', { name: 'Post entry' })).toHaveCount(0);
    await expect(block(page).getByText(journalId, { exact: true })).toHaveCount(2); // on the entry, and its run log row
    await expect(block(page).getByRole('status')).toHaveText(`Posted as ${journalId}.`);
    // Focus moves to what replaced the pressed button, never to the page.
    await expect(block(page).getByRole('button', { name: 'Replay Agent block' })).toBeFocused();
  });

  test('Replay plays the run back to the waiting proposal, and hands focus to Post entry', async ({ page }) => {
    await openCard(page);
    await block(page).getByRole('button', { name: 'Post entry' }).click();
    await block(page).getByRole('button', { name: 'Replay Agent block' }).click();
    await expect(block(page).locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(block(page).getByRole('button', { name: 'Post entry' })).toBeFocused({ timeout: 6000 });
    await expect(block(page).locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(block(page).getByRole('status')).toHaveText('Awaiting review.');
  });

  test('Don’t post declines it, and nothing reaches the books', async ({ page }) => {
    await openCard(page);
    await block(page).getByRole('button', { name: 'Don’t post' }).click();
    await expect(block(page).getByText('AI · Not posted')).toBeVisible();
    await expect(block(page).getByText('declined by you')).toBeVisible();
    await expect(block(page).getByText(journalId)).toHaveCount(0);
    await expect(block(page).getByText(reversed).last()).toBeVisible();
    await expect(block(page).getByRole('status')).toHaveText('Not posted.');
  });

  test('Edit entry changes the memo and period, and the proposal still waits', async ({ page }) => {
    await openCard(page);
    await block(page).getByRole('button', { name: 'Edit entry' }).click();
    const period = block(page).getByLabel('Period');
    await expect(period).toBeFocused();
    await period.fill('2026-11');
    await block(page).getByLabel('Memo').fill('Reverse the duplicate MFL invoice');
    await block(page).getByRole('button', { name: 'Done' }).click();
    await expect(block(page).getByText('Reverse the duplicate MFL invoice')).toBeVisible();
    await expect(block(page).getByText('period 2026-11')).toBeVisible();
    await expect(block(page).getByText('AI · Awaiting review')).toBeVisible();
    await expect(block(page).getByRole('button', { name: 'Edit entry' })).toBeFocused();
  });
});

test.describe('the Tool card', () => {
  const tool = (page: Page) => card(page, 'tool');
  const summary = (page: Page) => tool(page).getByRole('button', { name: 'Read 3 files' });

  /** The card plays when it scrolls in, and rests on the three reads folded into one line. */
  async function openCard(page: Page) {
    await open(page, '/');
    await tool(page).scrollIntoViewIfNeeded();
    await expect(tool(page).locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 6000 });
    await expect(summary(page)).toBeVisible();
  }

  test('rests on one line, folded, with the failure and its next step in view', async ({ page }) => {
    await openCard(page);
    await expect(summary(page)).toHaveAttribute('aria-expanded', 'false');
    // Exact: the live region holds the same words, joined, for a few seconds after it announces them.
    await expect(
      tool(page).getByText('Couldn’t match bank_export_kjp_2026-09.csv to fields: it has no header row.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      tool(page).getByText('I’ll take both payments as the invoice file records them.', { exact: true }),
    ).toBeVisible();
  });

  test('says a file was read only once it has been', async ({ page }) => {
    await openCard(page);
    await tool(page).getByRole('button', { name: 'Replay Tool' }).click();
    // Mid-run the line says what's running, and the summary's past tense waits for the last read.
    await expect(tool(page).getByRole('button', { name: /^Reading / })).toBeVisible();
    await expect(summary(page)).toHaveCount(0);
    await expect(summary(page)).toBeVisible({ timeout: 6000 });
  });

  test('opens to each read, and each read to what it found', async ({ page }) => {
    await openCard(page);
    await summary(page).click();
    await expect(tool(page).getByRole('listitem')).toHaveCount(3);
    await tool(page)
      .getByRole('button', { name: /^Read supplier_invoices/ })
      .click();
    await expect(tool(page).getByText(/appears twice/)).toBeVisible();
  });
});

test.describe('the Question card', () => {
  const question = (page: Page) => card(page, 'question');
  const option = (page: Page, name: string) => question(page).getByRole('button', { name });

  /** The card plays when it scrolls in; the question arrives with the last frame. */
  async function openCard(page: Page) {
    await open(page, '/');
    await question(page).scrollIntoViewIfNeeded();
    await expect(option(page, 'KJP only')).toBeVisible({ timeout: 6000 });
    await expect(question(page).locator('[aria-busy="true"]')).toHaveCount(0);
  }

  test('one press answers, and the outcome takes focus', async ({ page }) => {
    await openCard(page);
    await expect(question(page).getByText('AI · Awaiting your answer')).toBeVisible();
    await expect(question(page).getByRole('radio')).toHaveCount(0);
    await option(page, 'KJP only').click();
    await expect(question(page).getByText('AI · Answered')).toBeVisible();
    await expect(question(page).getByText('Answered by you: KJP only.')).toBeFocused();
    await expect(option(page, 'All entities')).toHaveCount(0);
  });

  test('Choose for me lets the agent decide, and it says what it chose', async ({ page }) => {
    await openCard(page);
    await option(page, 'Choose for me').click();
    await expect(question(page).getByText('AI · Decided')).toBeVisible();
    await expect(question(page).getByText(/^I chose all entities/)).toBeFocused();
  });

  test('Replay asks again, and hands focus to the first option', async ({ page }) => {
    await openCard(page);
    await option(page, 'Skip').click();
    await expect(question(page).getByText('AI · Skipped')).toBeVisible();
    await question(page).getByRole('button', { name: 'Replay Question' }).click();
    await expect(option(page, 'All entities')).toBeFocused({ timeout: 6000 });
    await expect(question(page).getByRole('status')).toHaveText('Awaiting your answer.');
  });
});

test.describe('the Confirmation card', () => {
  const confirmation = (page: Page) => card(page, 'confirmation');
  const send = (page: Page) => confirmation(page).getByRole('button', { name: 'Send summary' });
  const sent = 'Sent once, by you. The next send asks again.';

  /** The card plays when it scrolls in; the question arrives with the last frame. */
  async function openCard(page: Page) {
    await open(page, '/');
    await confirmation(page).scrollIntoViewIfNeeded();
    await expect(send(page)).toBeVisible({ timeout: 6000 });
    await expect(confirmation(page).locator('[aria-busy="true"]')).toHaveCount(0);
  }

  test('asks before it sends, and Send summary sends it once', async ({ page }) => {
    await openCard(page);
    await expect(confirmation(page).getByText('AI · Awaiting confirmation')).toBeVisible();
    await expect(confirmation(page).getByRole('term')).toHaveText(['What changes', 'Who it reaches']);
    await send(page).click();

    await expect(confirmation(page).getByText('AI · Sent')).toBeVisible();
    await expect(confirmation(page).getByRole('button', { name: 'Send summary' })).toHaveCount(0);
    // Focus moves to the outcome that replaced the pressed button, never to the page.
    await expect(confirmation(page).getByText(sent)).toBeFocused();
  });

  test('Replay asks again, and hands focus to Send summary', async ({ page }) => {
    await openCard(page);
    await send(page).click();
    await confirmation(page).getByRole('button', { name: 'Replay Confirmation' }).click();
    await expect(send(page)).toBeFocused({ timeout: 6000 });
    await expect(send(page)).toBeEnabled();
    await expect(confirmation(page).getByText('AI · Awaiting confirmation')).toBeVisible();
    await expect(confirmation(page).getByRole('status')).toHaveText('Awaiting confirmation.');
  });

  test('Don’t send stops it', async ({ page }) => {
    await openCard(page);
    await confirmation(page).getByRole('button', { name: 'Don’t send' }).click();
    await expect(confirmation(page).getByText('AI · Not sent')).toBeVisible();
    await expect(confirmation(page).getByText('Not sent. The summary stays here.')).toBeFocused();
  });
});

test.describe('the cards', () => {
  test('a card below the first screen rewinds unseen and plays to rest when it scrolls in', async ({ page }) => {
    await open(page, '/');
    const badges = card(page, 'status-badge').locator('[data-slot="badge"], li');
    // Rewound while out of view: only the first badge.
    await expect(card(page, 'status-badge').getByRole('listitem')).toHaveCount(1);
    await card(page, 'status-badge').scrollIntoViewIfNeeded();
    await expect(card(page, 'status-badge').getByRole('listitem')).toHaveCount(9, { timeout: 6000 });
    await expect(badges.first()).toBeVisible();
  });

  test('Replay replays a card and says so once', async ({ page }) => {
    await open(page, '/');
    const plan = card(page, 'agent-plan');
    await plan.scrollIntoViewIfNeeded();
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeVisible({ timeout: 6000 });
    await plan.getByRole('button', { name: 'Replay Agent plan' }).click();
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeDisabled();
    await expect(plan.getByRole('status')).toHaveText('Agent plan replayed.', { timeout: 6000 });
    await expect(plan.getByRole('button', { name: 'Run plan' })).toBeEnabled();
  });

  // Replay used to rewind a specimen to its first frame, so its plate shrank and
  // the page jumped (owner, 2026-10-26). The rest frame now holds the height
  // while it plays. Every card with a Replay, at desktop and phone widths.
  for (const width of [1280, 390]) {
    test(`every card keeps its height while it replays, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/');
      for (const name of [
        'chat-starter',
        'chat-composer',
        'agent-reasoning',
        'agent-plan',
        'lineage-tree',
        'attachment-row',
        'inline-citation',
        'sources',
        'chat-thread',
        'run-log-row',
        'status-badge',
      ]) {
        const article = card(page, name).locator('article');
        await article.scrollIntoViewIfNeeded();
        await expect(card(page, name).locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 6000 });
        // Press Replay and read the height two frames later, on the first frame
        // of the run, in one script so no frame is missed.
        const [atRest, mid] = await article.evaluate(async (el) => {
          const h = () => Math.round(el.getBoundingClientRect().height);
          const rest = h();
          el.querySelector<HTMLButtonElement>('button[aria-label^="Replay "]')!.click();
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return [rest, h()];
        });
        expect(mid, `${name} at ${width}px`).toBe(atRest);
      }
    });
  }
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every card stays at rest, and nothing animates', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#status-badge').getByRole('listitem')).toHaveCount(9);
    await expect(page.locator('#run-log-row').getByText('No header row', { exact: false })).toBeVisible();
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
    expect(running).toBe(0);
  });

  test('Replay jumps straight to rest', async ({ page }) => {
    await open(page, '/');
    const block = card(page, 'agent-block');
    await block.getByRole('button', { name: 'Post entry' }).click();
    await block.getByRole('button', { name: 'Replay Agent block' }).click();
    await expect(block.getByRole('button', { name: 'Post entry' })).toBeFocused();
    await expect(block.locator('[aria-busy="true"]')).toHaveCount(0);
  });
});
