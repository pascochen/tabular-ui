import { expect, test } from '@playwright/test';

import { selectedTask, usedBy } from '../../demo/src/lib/kasane';
import {
  BUILT_CHANNELS,
  DEFAULT_VIEW,
  hrefFor,
  parseAtEnd,
  parseView,
  placeOf,
  sameView,
} from '../../demo/src/lib/view';

/**
 * The Kasane app's URLs (apps/demo/src/lib/view.ts): the URL is the store, so
 * every view must round-trip through it, and an old or unbuilt URL must open the
 * default, never a dead end.
 *
 * Nothing here needs a browser.
 */

test('`/` opens New chat, and New chat’s link is `/`', () => {
  expect(parseView('')).toEqual({ kind: 'new-chat' });
  expect(DEFAULT_VIEW).toEqual({ kind: 'new-chat' });
  expect(hrefFor(DEFAULT_VIEW)).toBe('/');
});

test('#revenue, the landing page until 2026-11-12, keeps a URL of its own', () => {
  expect(parseView('?view=revenue')).toEqual({ kind: 'channel', channel: 'revenue' });
  expect(hrefFor({ kind: 'channel', channel: 'revenue' })).toBe('?view=revenue');
});

test('the six channels open by their URLs, in the sidebar’s order', () => {
  expect(BUILT_CHANNELS).toEqual(['close', 'cash', 'receivables', 'payables', 'revenue', 'intercompany']);
  expect(parseView('?view=payables')).toEqual({ kind: 'channel', channel: 'payables' });
});

test('old and unknown URLs open the default', () => {
  for (const search of [
    '?view=sep-close',
    '?view=open-items',
    '?view=rev-check',
    '?view=nope',
    '?dm=controller',
    '?dm=agent',
    '?dm=nope',
  ]) {
    expect(parseView(search), search).toEqual(DEFAULT_VIEW);
  }
});

test('every built channel round-trips through its URL', () => {
  for (const channel of BUILT_CHANNELS) {
    const view = { kind: 'channel', channel } as const;
    expect(sameView(parseView(hrefFor(view)), view), channel).toBe(true);
  }
});

test('a direct message round-trips, a person’s or an agent’s', () => {
  for (const member of ['fpaHead', 'apLead', 'cutoff-ai', 'payments-ai', 'approvals-ai', 'credit-ai']) {
    expect(parseView(`?dm=${member}`), member).toEqual({ kind: 'dm', member });
    expect(hrefFor({ kind: 'dm', member })).toBe(`?dm=${member}`);
  }
});

test('Tasks opens by its URL, with or without a task', () => {
  expect(parseView('?view=tasks')).toEqual({ kind: 'tasks' });
  expect(parseView('?view=tasks&task=credit-limit')).toEqual({ kind: 'tasks', task: 'credit-limit' });
});

test('Sources opens by its URL, on a document and a finding’s records', () => {
  expect(parseView('?view=sources')).toEqual({ kind: 'sources' });
  expect(parseView('?view=sources&source=sales-invoices&item=revenue-cut-off')).toEqual({
    kind: 'sources',
    source: 'sales-invoices',
    item: 'revenue-cut-off',
  });
});

test('Search opens by its URL, with or without a query', () => {
  expect(parseView('?view=search')).toEqual({ kind: 'search' });
  expect(parseView('?view=search&q=Great+Lakes')).toEqual({ kind: 'search', q: 'Great Lakes' });
});

test('a view’s link carries what it selects, and encodes it', () => {
  expect(hrefFor({ kind: 'tasks' })).toBe('?view=tasks');
  expect(hrefFor({ kind: 'tasks', task: 'revenue-cut-off' })).toBe('?view=tasks&task=revenue-cut-off');
  expect(hrefFor({ kind: 'sources', source: 'sales-invoices', item: 'revenue-cut-off' })).toBe(
    '?view=sources&source=sales-invoices&item=revenue-cut-off',
  );
  expect(hrefFor({ kind: 'search', q: 'Great Lakes' })).toBe('?view=search&q=Great+Lakes');
});

test('a sidebar item stays active whatever its view has selected inside', () => {
  expect(placeOf({ kind: 'tasks', task: 'credit-limit' })).toBe(placeOf({ kind: 'tasks' }));
  expect(placeOf({ kind: 'sources', source: 'accounting-policies' })).toBe(placeOf({ kind: 'sources' }));
  expect(placeOf({ kind: 'dm', member: 'apLead' })).not.toBe(placeOf({ kind: 'dm', member: 'fpaHead' }));
  expect(placeOf({ kind: 'new-chat' })).not.toBe(placeOf({ kind: 'channel', channel: 'revenue' }));
});

test('?at=end opens the end state with any view', () => {
  expect(parseAtEnd('?at=end')).toBe(true);
  expect(parseAtEnd('?view=revenue&at=end')).toBe(true);
  expect(parseAtEnd('?dm=apLead&at=end')).toBe(true);
  expect(parseAtEnd('?view=revenue')).toBe(false);
  expect(parseView('?dm=apLead&at=end')).toEqual({ kind: 'dm', member: 'apLead' });
});

test('a document says which findings use it', () => {
  const ids = (slug: string) => usedBy(slug).map((e) => e.id);
  expect(ids('sales-invoices')).toEqual(['revenue-cut-off']);
  // The duplicate rests on both the invoice file and the payment file.
  expect(ids('supplier-payments')).toEqual(['duplicate-payment']);
  // An agent reads the close calendar, and no finding rests on it.
  expect(ids('close-calendar')).toEqual([]);
});

test('Tasks selects the first task when none is chosen, and nothing for an id that matches none', () => {
  expect(selectedTask()?.id).toBe('revenue-cut-off');
  expect(selectedTask('credit-limit')?.id).toBe('credit-limit');
  // A fallback to the first task would say the link chose it.
  expect(selectedTask('no-such-task')).toBeUndefined();
  expect(selectedTask('')).toBeUndefined();
});
