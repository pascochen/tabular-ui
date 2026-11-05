import { expect, test } from '@playwright/test';

import { citedBy } from '../../demo/src/lib/kasane';
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

test('`/` opens #revenue, and #revenue’s link is `/`', () => {
  expect(parseView('')).toEqual({ kind: 'channel', channel: 'revenue' });
  expect(DEFAULT_VIEW).toEqual({ kind: 'channel', channel: 'revenue' });
  expect(hrefFor(DEFAULT_VIEW)).toBe('/');
  expect(parseView('?view=revenue')).toEqual(DEFAULT_VIEW);
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
    expect(sameView(parseView(hrefFor(view).replace('/', '')), view), channel).toBe(true);
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

test('the binder opens by its URL, on a source and a record', () => {
  expect(parseView('?view=sources')).toEqual({ kind: 'sources' });
  expect(parseView('?view=sources&source=S-17&record=INV-KJP-2609-00363')).toEqual({
    kind: 'sources',
    source: 'S-17',
    record: 'INV-KJP-2609-00363',
  });
});

test('Search opens by its URL, with or without a query', () => {
  expect(parseView('?view=search')).toEqual({ kind: 'search' });
  expect(parseView('?view=search&q=Great+Lakes')).toEqual({ kind: 'search', q: 'Great Lakes' });
});

test('a view’s link carries what it selects, and encodes it', () => {
  expect(hrefFor({ kind: 'tasks' })).toBe('?view=tasks');
  expect(hrefFor({ kind: 'tasks', task: 'revenue-cut-off' })).toBe('?view=tasks&task=revenue-cut-off');
  expect(hrefFor({ kind: 'sources', source: 'S-17', record: 'INV-KJP-2609-00363' })).toBe(
    '?view=sources&source=S-17&record=INV-KJP-2609-00363',
  );
  expect(hrefFor({ kind: 'search', q: 'Great Lakes' })).toBe('?view=search&q=Great+Lakes');
});

test('a sidebar item stays active whatever its view has selected inside', () => {
  expect(placeOf({ kind: 'tasks', task: 'credit-limit' })).toBe(placeOf({ kind: 'tasks' }));
  expect(placeOf({ kind: 'sources', source: 'S-1' })).toBe(placeOf({ kind: 'sources' }));
  expect(placeOf({ kind: 'dm', member: 'apLead' })).not.toBe(placeOf({ kind: 'dm', member: 'fpaHead' }));
});

test('?at=end opens the end state with any view', () => {
  expect(parseAtEnd('?at=end')).toBe(true);
  expect(parseAtEnd('?view=revenue&at=end')).toBe(true);
  expect(parseAtEnd('?dm=apLead&at=end')).toBe(true);
  expect(parseAtEnd('?view=revenue')).toBe(false);
  expect(parseView('?dm=apLead&at=end')).toEqual({ kind: 'dm', member: 'apLead' });
});

test('a source says which findings cite it, and only findings', () => {
  const ids = (name: string) => citedBy(name).map((e) => e.id);
  expect(ids('sales_invoices_2026-09.csv')).toEqual(['revenue-cut-off']);
  // The duplicate rests on both the invoice file and the payment file.
  expect(ids('supplier_payments_fy2026_h1.csv')).toEqual(['duplicate-payment']);
  // An agent reads the close calendar, and no finding cites it.
  expect(ids('close_calendar.md')).toEqual([]);
});
