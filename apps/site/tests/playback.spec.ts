import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { componentPages, routes } from './routes';

/** The specimens' playback, the hero's loop, and the Agent block card's choices (docs/site.md §6, D6). */

const kasane = JSON.parse(readFileSync(new URL('../data/kasane.json', import.meta.url), 'utf8')) as {
  duplicatePayment: {
    nextJournalId: string;
    entries: string[];
    supplierInvoice: string;
    sheet: { entry: string; invoice: string; supplier: string }[];
  };
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

/** The hero's frame, and where its loop is: `data-hero` names the frame on show. */
const sheet = (page: Page) => hero(page).locator('[data-hero]');
const reaches = (page: Page, frame: string, timeout = 12_000) =>
  expect(sheet(page)).toHaveAttribute('data-hero', frame, { timeout });

test.describe('the hero', () => {
  test('opens on the finding, with the agent waiting, and its only button is Pause', async ({ page, request }) => {
    // The HTML is the rest frame, and has no Pause: without script nothing moves.
    const html = await (await request.get('/')).text();
    expect(html).toContain('data-hero="waiting"');
    expect(html).not.toContain('Pause animation');

    await open(page, '/');
    await reaches(page, 'waiting', 1000);
    await expect(hero(page).getByText('Question: Did we pay any invoice twice?')).toBeVisible();
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    await expect(sheet(page).locator('[data-cell="flagged"]')).toHaveCount(1);
    // The mic, Post entry and Don’t post are drawn as controls and are not ones (owner, 2026-11-17).
    await expect(sheet(page).getByRole('button')).toHaveCount(1);
    await expect(sheet(page).getByRole('button', { name: 'Pause animation' })).toBeVisible();
    await expect(sheet(page).getByText('Post entry')).toBeVisible();
  });

  // Every row is the data's (§5): the entity's invoices from the duplicate's first
  // entry to its second, so the sheet opens and closes on the finding.
  test('the sheet is the invoices between the duplicate’s two entries, from the data', async ({ page }) => {
    await open(page, '/');
    const { sheet: rows, entries, supplierInvoice } = kasane.duplicatePayment;
    expect(rows.length).toBeLessThanOrEqual(7);
    expect([rows[0].entry, rows.at(-1)!.entry]).toEqual(entries);
    const body = sheet(page).locator('tbody tr');
    await expect(body).toHaveCount(rows.length);
    for (const [i, row] of rows.entries()) {
      await expect(body.nth(i)).toContainText(row.entry);
      await expect(body.nth(i)).toContainText(row.invoice);
      await expect(body.nth(i)).toContainText(row.supplier.split(' ')[0]);
    }
    for (const i of [0, rows.length - 1]) await expect(body.nth(i)).toContainText(supplierInvoice);
  });

  test('nothing moves for 2.5 seconds, then the entry is posted, the question is heard and the duplicate is found again', async ({
    page,
  }) => {
    test.setTimeout(40_000);
    await open(page, '/');
    const plate = 'section[aria-labelledby="hero-title"] [data-plate]';
    const atRest = await height(page, plate);
    const started = Date.now();
    // The frame that leaves lasts 200ms, too short to wait for: the page notes what it
    // looked like when it began.
    await sheet(page).evaluate((el) => {
      new MutationObserver(() => {
        if (el.getAttribute('data-hero') !== 'leaving') return;
        const question = getComputedStyle(el.querySelector('[data-question]')!);
        const outline = getComputedStyle(el.querySelector('[data-outline="on"]')!);
        (window as unknown as { leaving: unknown }).leaving = {
          question: [question.transitionProperty, question.transitionDuration],
          outline: [outline.transitionProperty, outline.transitionDuration, outline.clipPath],
          marks: el.querySelectorAll('[data-cell]').length,
        };
      }).observe(el, { attributes: true, attributeFilter: ['data-hero'] });
    });
    await reaches(page, 'post-ring');
    expect(Date.now() - started).toBeGreaterThan(2000);
    // The ring is the system's, drawn: nothing in the frame holds focus.
    expect(
      await sheet(page)
        .locator('[data-post]')
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).toBe('solid');

    await reaches(page, 'posted');
    await expect(hero(page).getByText('AI · Posted')).toBeVisible();
    await expect(hero(page).getByText('posted by you')).toBeVisible();
    await expect(hero(page).getByText(`Posted as ${journalId}.`)).toBeVisible();
    expect(await height(page, plate)).toBe(atRest);

    // The pass: the mic, the wave and the words, then the two amounts.
    await reaches(page, 'listening');
    // The question and the sheet's marks left on the card's fade, not on a cut (owner, 2026-11-17).
    expect(await page.evaluate(() => (window as unknown as { leaving: unknown }).leaving)).toEqual({
      question: ['opacity', '0.2s'],
      outline: ['opacity', '0.2s', 'none'],
      marks: 0,
    });
    await expect(sheet(page).locator('[data-wave]')).toBeVisible();
    await expect(sheet(page).locator('[data-mic]')).toHaveAttribute('data-mic', 'on');
    await expect(sheet(page).locator('[data-cell], [data-cursor], [data-outline="on"]')).toHaveCount(0);
    expect(await height(page, plate)).toBe(atRest);

    await reaches(page, 'looking');
    const amounts = sheet(page).locator('tbody tr td:last-child');
    await expect(amounts.first()).toHaveAttribute('data-cell', 'looked');
    await expect(amounts.first()).toHaveAttribute('data-cursor', '');
    await expect(sheet(page).locator('[data-outline="on"]')).toHaveCount(1);

    await reaches(page, 'waiting');
    await expect(amounts.last()).toHaveAttribute('data-cell', 'flagged');
    await expect(amounts.last()).toHaveAttribute('data-cursor', '');
    await expect(amounts.first()).toHaveAttribute('data-cell', 'looked');
    await expect(sheet(page).locator('[data-outline="on"]')).toHaveCount(2);
    await expect(hero(page).getByText('AI · Awaiting review')).toBeVisible();
    expect(await height(page, plate)).toBe(atRest);
  });

  test('Pause holds the frame, and Play goes on from it', async ({ page }) => {
    await open(page, '/');
    await sheet(page).getByRole('button', { name: 'Pause animation' }).click();
    const play = sheet(page).getByRole('button', { name: 'Play animation' });
    await expect(play).toBeVisible();
    await expect(play).toBeFocused();
    // Longer than the 2.5s the frame waits when it runs.
    await page.waitForTimeout(3500);
    await reaches(page, 'waiting', 100);
    await play.click();
    await reaches(page, 'post-ring', 4000);
  });

  // The outline's width is the sheet's, less its row numbers: it is drawn by CSS
  // from the first cell, with nothing measured in script.
  test('a row’s outline spans its data cells, at a phone’s width too', async ({ page }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await open(page, '/');
      const box = await sheet(page)
        .locator('tbody tr')
        .first()
        .evaluate((row) => {
          const outline = row.querySelector('[data-outline]')!.getBoundingClientRect();
          const cells = [...row.querySelectorAll('td')].filter((td) => td.getBoundingClientRect().width > 0);
          return {
            // Math.abs: a rounded -0.2 is -0, which is not 0 to toEqual.
            left: Math.abs(Math.round(outline.left - cells[1].getBoundingClientRect().left)),
            right: Math.abs(Math.round(outline.right - cells.at(-1)!.getBoundingClientRect().right)),
            shown: cells.length - 1,
          };
        });
      expect(box, `at ${width}px`).toEqual({ left: 0, right: 0, shown: width < 600 ? 3 : 5 });
      // Nothing the finding rests on is cut short: the invoice number and the amount.
      const clipped = await sheet(page)
        .locator('tbody td:nth-child(3) > *, tbody td:last-child')
        .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length);
      expect(clipped, `at ${width}px`).toBe(0);
    }
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('it is the waiting card, with nothing running and no Pause', async ({ page }) => {
      await open(page, '/');
      await page.waitForTimeout(3500);
      await reaches(page, 'waiting', 100);
      await expect(sheet(page).getByRole('button')).toHaveCount(0);
      expect(await sheet(page).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    });
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
  const summary = (page: Page) => tool(page).getByRole('button', { name: 'Read 2 of 3 files' });

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
      tool(page).getByText('Couldn’t read the columns in bank_export_kjp_2026-09.csv: it has no header row.', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      tool(page).getByText('I’ll take both payments as the payment file records them.', { exact: true }),
    ).toBeVisible();
  });

  test('says Read only once a file is done', async ({ page }) => {
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
        'chat-thread',
        'agent-reasoning',
        'agent-plan',
        'lineage-tree',
        'attachment-row',
        'inline-citation',
        'sources',
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

test.describe('the cards in a row', () => {
  /** Each card's frame and caption, in viewport pixels, for one moment's section. */
  const cards = (page: Page, moment: string) =>
    page.locator(`#${moment} > ul > li`).evaluateAll((items) =>
      items.map((li) => {
        const article = li.querySelector('article')!;
        const frame = article.firstElementChild!.getBoundingClientRect();
        const caption = article.lastElementChild!.getBoundingClientRect();
        return {
          name: li.id,
          top: Math.round(frame.top),
          bottom: Math.round(frame.bottom),
          captionTop: Math.round(caption.top),
          gap: Math.round(caption.top - frame.bottom),
        };
      }),
    );

  // A floor on the frame can't do this: captions wrap differently, and the row's
  // height has to reach every frame. Frame bottoms and caption tops, not heights,
  // because a frame can be the right height and still end out of line.
  for (const width of [1440, 1280, 1024]) {
    test(`end on one line, and their captions start on one, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/');
      for (const moment of ['asking', 'thinking', 'showing', 'waiting', 'recording']) {
        const found = await cards(page, moment);
        for (const top of new Set(found.map((c) => c.top))) {
          const row = found.filter((c) => c.top === top);
          const label = `${moment} at ${width}px: ${row.map((c) => c.name).join(', ')}`;
          expect(new Set(row.map((c) => c.bottom)).size, label).toBe(1);
          expect(new Set(row.map((c) => c.captionTop)).size, label).toBe(1);
          for (const c of row) expect(c.gap, `${c.name} at ${width}px`).toBe(12); // --gap-group
        }
      }
    });
  }

  // Showing's four cards sit two to a row, the other moments' three (owner,
  // 2026-11-16): equal widths in every moment, and Showing's two rows of two
  // each reach both edges of the list, so Sources isn't left alone on a row.
  for (const width of [1440, 1280, 1024]) {
    test(`take three to a row, and Showing two, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/');
      for (const moment of ['asking', 'thinking', 'showing', 'waiting', 'recording']) {
        const { list, items } = await page.locator(`#${moment} > ul`).evaluate((ul) => {
          const box = (el: Element) => {
            const r = el.getBoundingClientRect();
            return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), width: r.width };
          };
          return { list: box(ul), items: [...ul.children].map((li) => ({ name: li.id, ...box(li) })) };
        });
        const perRow = moment === 'showing' ? 2 : 3;
        expect(new Set(items.map((c) => Math.round(c.width))).size, `${moment} at ${width}px: equal widths`).toBe(1);
        expect(
          items.filter((c) => c.top === items[0].top),
          `${moment} at ${width}px`,
        ).toHaveLength(Math.min(perRow, items.length));
        if (moment !== 'showing') continue;
        for (const top of new Set(items.map((c) => c.top))) {
          const row = items.filter((c) => c.top === top);
          const label = `showing at ${width}px: ${row.map((c) => c.name).join(', ')}`;
          expect(Math.min(...row.map((c) => c.left)), label).toBe(list.left);
          expect(Math.max(...row.map((c) => c.right)), label).toBe(list.right);
        }
      }
    });
  }

  // A shorter box cut the answer off behind "Scroll to latest" at 1024px, with no
  // error, and the frame's height still passed.
  for (const width of [1440, 1280, 1024, 390]) {
    test(`Chat thread shows its whole answer, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page, '/');
      const thread = card(page, 'chat-thread');
      await thread.scrollIntoViewIfNeeded();
      // The rest frame: the invisible copy that holds the height doesn't count, and
      // before the answer arrives the thread holds space for it, which does scroll.
      await expect(thread.getByText('paid supplier invoice', { exact: false }).locator('visible=true')).toHaveCount(1, {
        timeout: 6000,
      });
      await expect
        .poll(() =>
          thread.locator('[data-plate] *').evaluateAll((els) => {
            const scrollers = els.filter((el) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY));
            return scrollers.length ? Math.max(...scrollers.map((el) => el.scrollHeight - el.clientHeight)) : null;
          }),
        )
        .toBe(0);
    });
  }

  test('grow together when one opens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, '/');
    const block = card(page, 'agent-block');
    await block.scrollIntoViewIfNeeded();
    await expect(block.getByRole('button', { name: 'Edit entry' })).toBeVisible({ timeout: 6000 });
    const before = await height(page, '#question article > :first-child');
    await block.getByRole('button', { name: 'Edit entry' }).click();
    await expect(block.getByLabel('Memo')).toBeVisible();
    const open_ = await height(page, '#agent-block article > :first-child');
    expect(open_).toBeGreaterThan(before);
    expect(await height(page, '#question article > :first-child')).toBe(open_);
    expect(await height(page, '#confirmation article > :first-child')).toBe(open_);
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every card stays at rest, and nothing animates', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#status-badge').getByRole('listitem')).toHaveCount(10);
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

/**
 * The prerendered HTML is the rest frame (docs/site.md §6), and it is what a
 * visitor sees before hydration, which the site defers past the first paint.
 * MessageScroller hid its thread until a scroll only script can apply, so with
 * no script the Chat thread card was an empty frame (docs/failure-log.md, 2026-11-16).
 */
test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the Chat thread card shows its question and its answer', async ({ page }) => {
    await page.goto('/');
    const thread = card(page, 'chat-thread');
    await expect(thread.getByText('Did we pay any invoice twice?')).toBeVisible();
    await expect(thread.getByText('paid supplier invoice', { exact: false })).toBeVisible();
  });

  for (const route of routes) {
    test(`${route}: no message thread hides itself`, async ({ page }) => {
      await page.goto(route);
      // A thread inside a copy that is invisible on purpose, the one that holds a
      // plate's height, inherits that, so only a thread that hides itself counts.
      const hidden = await page
        .locator('[data-slot="message-scroller-viewport"]')
        .evaluateAll(
          (els) =>
            els.filter(
              (el) =>
                getComputedStyle(el).visibility !== 'visible' &&
                getComputedStyle(el.parentElement!).visibility === 'visible',
            ).length,
        );
      expect(hidden).toBe(0);
    });
  }
});

/**
 * A component page's pair (docs/site.md, "Component page"; owner, 2026-11-15):
 * at rest until asked, then the after plate plays from the before state to its own.
 */
test.describe('a component page’s pair', () => {
  const frame = '#pair-title ~ figure > div:first-child';
  const plates = (page: Page) => page.locator('#pair-title ~ figure [data-theme="dark"]');
  const playButton = (page: Page) => page.locator('#pair-title ~ figure').getByRole('button', { name: /^Play / });
  // The playing plate, not a component inside one: a plan being written is aria-busy too.
  const busy = (page: Page) => page.locator('#pair-title ~ figure [data-theme="dark"][aria-busy="true"]');
  // Play's own live region. Components have theirs (AgentReasoning, Tool).
  const said = (page: Page) => page.locator('#pair-title ~ figure [data-pair-play] [role="status"]');
  /**
   * What each plate shows: its text, without the invisible states that hold the after
   * plate's height, and without a component's own announcement (Tool says what it read).
   * Without anything aria-hidden either: a working label's visible copy counts its
   * seconds ("Drafting step 3 · 0:03"), so the before plate read differently after a
   * run of three seconds, and failed in CI. Its hidden copy, the bare label, stays.
   */
  const shown = (page: Page) =>
    plates(page).evaluateAll((els) =>
      els.map((el, i) => {
        const state = (i === 0 ? el : el.querySelector(':scope > div > div')!).cloneNode(true) as Element;
        state.querySelectorAll('[role="status"], [aria-hidden="true"]').forEach((region) => region.remove());
        return state.textContent;
      }),
    );

  for (const width of [1280, 390]) {
    for (const route of componentPages) {
      test(`${route}: Play runs the after plate from the before state to its own, at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await open(page, route);
        // Nothing plays on its own: the pair is what a visitor first reads.
        await expect(busy(page)).toHaveCount(0);
        const [before, atRest] = await shown(page);
        const name = (await playButton(page).getAttribute('aria-label'))!.replace(/^Play /, '');

        // Press Play and read the first state two frames later, in one script so it isn't missed.
        const [restHeight, midHeight, first] = await page.locator(frame).evaluate(async (el) => {
          const h = () => Math.round(el.getBoundingClientRect().height);
          const rest = h();
          el.parentElement!.querySelector<HTMLButtonElement>('button[aria-label^="Play "]')!.click();
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const playing = el.querySelector('[data-theme="dark"][aria-busy="true"] > div > div')?.cloneNode(true) as
            Element | undefined;
          playing?.querySelectorAll('[role="status"], [aria-hidden="true"]').forEach((region) => region.remove());
          return [rest, h(), playing?.textContent ?? null];
        });
        expect(first, 'the run starts on the before state').toBe(before);
        expect(midHeight, 'the frame keeps its height').toBe(restHeight);

        await expect(said(page)).toHaveText(`${name} played.`, { timeout: 6000 });
        await expect(busy(page)).toHaveCount(0);
        const [beforeAfter, afterAfter] = await shown(page);
        expect(beforeAfter).toBe(before);
        expect(afterAfter).toBe(atRest);
      });
    }
  }

  test('a mouse that moves into the frame plays it once, and says nothing', async ({ page }) => {
    await open(page, '/components/agent-plan');
    // On a page with rules to follow, the pair starts below the first screen.
    await page.locator(frame).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const box = (await page.locator(frame).boundingBox())!;
    const inside = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(inside.x, box.y - 40);
    await expect(busy(page)).toHaveCount(0);
    await page.mouse.move(inside.x, inside.y);
    await expect(busy(page)).toHaveCount(1);
    await expect(busy(page)).toHaveCount(0, { timeout: 6000 });
    await expect(said(page)).toHaveText('');

    // Still inside: moving again plays nothing. A pointerleave is what arms the next run,
    // so the check waits on a move the frame has received.
    await page.mouse.move(inside.x + 10, inside.y + 10);
    await page.mouse.move(inside.x, inside.y);
    await expect(busy(page)).toHaveCount(0);

    // Out and back in: once more.
    await page.mouse.move(inside.x, box.y - 40);
    await page.mouse.move(inside.x, inside.y);
    await expect(busy(page)).toHaveCount(1);
  });

  // A live plate is there to select from or press. A run would take Inline citation's
  // mark away as the mouse reached it, which is how its font test first failed.
  for (const name of ['inline-citation', 'attachment-row', 'status-badge']) {
    test(`${name}: the mouse plays nothing over a live plate`, async ({ page }) => {
      await open(page, `/components/${name}`);
      // On a page with rules to follow, the pair starts below the first screen.
      await page.locator(frame).evaluate((el) => el.scrollIntoView({ block: 'center' }));
      const box = (await page.locator(frame).boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y - 40);
      // The frame's own listener is what would have played it, so wait for a move it received.
      await page.locator(frame).evaluate((el) => {
        el.addEventListener('pointermove', () => el.setAttribute('data-moved', ''), { once: true });
      });
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect(page.locator(frame)).toHaveAttribute('data-moved', '');
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await expect(busy(page)).toHaveCount(0);
    });
  }

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('nothing moves: Play and the mouse leave the pair at rest', async ({ page }) => {
      await open(page, '/components/agent-plan');
      const atRest = await shown(page);
      // On a page with rules to follow, the pair starts below the first screen.
      await page.locator(frame).evaluate((el) => el.scrollIntoView({ block: 'center' }));
      const box = (await page.locator(frame).boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await expect(busy(page)).toHaveCount(0);
      await playButton(page).click();
      await expect(said(page)).toHaveText('Agent plan played.');
      await expect(busy(page)).toHaveCount(0);
      expect(await shown(page)).toEqual(atRest);
    });
  });
});
