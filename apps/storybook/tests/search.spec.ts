import { expect, test } from '@playwright/test';

import { closeReducer, landingState } from '../../demo/src/lib/close-state';
import { SEARCH_GROUPS, search } from '../../demo/src/lib/search';

/**
 * The Kasane app's Search (apps/demo/src/lib/search.ts): client-side matching over
 * the fixtures, case-insensitive, anywhere in the text. Nothing here needs a browser.
 */

const groups = (q: string, state = landingState()) => search(state, q).map((r) => r.group);
const inGroup = (q: string, group: string, state = landingState()) => search(state, q).filter((r) => r.group === group);

test('a blank query finds nothing', () => {
  expect(search(landingState(), '')).toEqual([]);
  expect(search(landingState(), '   ')).toEqual([]);
});

test('matching ignores case and finds text anywhere', () => {
  expect(groups('GREAT LAKES')).toEqual(groups('great lakes'));
  expect(inGroup('lakes', 'Tasks').map((r) => r.key)).toEqual(['credit-limit']);
});

test('the spec’s suggested searches all find something', () => {
  for (const q of ['MFL-58821', 'Great Lakes', 'cut-off'])
    expect(search(landingState(), q).length, q).toBeGreaterThan(0);
});

test('a task is found by its title or summary, and links to itself', () => {
  expect(inGroup('MFL-58821', 'Tasks')).toEqual([
    expect.objectContaining({ key: 'duplicate-payment', view: { kind: 'tasks', task: 'duplicate-payment' } }),
  ]);
});

test('a source is found by its ID, its name or a record it cites, and links to that record', () => {
  expect(inGroup('S-17', 'Sources')[0].view).toEqual({ kind: 'sources', source: 'S-17', record: undefined });
  expect(inGroup('ar_aging', 'Sources')[0].key).toBe('S-12');
  expect(inGroup('INV-KJP-2609-00363', 'Sources')[0].view).toEqual({
    kind: 'sources',
    source: 'S-17',
    record: 'INV-KJP-2609-00363',
  });
});

test('a cited record is found by anything in its row, and links to the record', () => {
  // The supplier's own number isn't the record's ID: the wireframe's example.
  expect(inGroup('MFL-58821', 'Sources')).toEqual([
    expect.objectContaining({
      key: 'S-18',
      detail: 'API-KUS-2607-00007 and API-KUS-2607-00011',
      view: { kind: 'sources', source: 'S-18', record: 'API-KUS-2607-00007' },
    }),
  ]);
});

test('a message is found by its body, and lands on its finding in its channel', () => {
  expect(inGroup('Logistics confirms', 'Messages')).toEqual([
    expect.objectContaining({ view: { kind: 'channel', channel: 'revenue' }, hash: '#revenue-cut-off' }),
  ]);
});

test('a reply that hasn’t landed isn’t found, and is once it has', () => {
  expect(inGroup('Midwest Freight', 'Messages')).toEqual([]);
  const end = closeReducer(landingState(), { type: 'skip', at: '14:00' });
  expect(inGroup('Midwest Freight', 'Messages', end).map((r) => r.view)).toEqual([
    { kind: 'channel', channel: 'payables' },
  ]);
});

test('what the visitor wrote is found, and links to where they wrote it', () => {
  const s = closeReducer(landingState(), {
    type: 'say',
    where: 'cutoff-ai',
    text: 'A note about rebates',
    at: '14:00',
  });
  expect(inGroup('rebates', 'Messages', s).map((r) => r.view)).toEqual([{ kind: 'dm', member: 'cutoff-ai' }]);
});

test('a person is found by name or title, and links to their direct message, or else a channel of theirs', () => {
  expect(inGroup('Kenta', 'People')[0].view).toEqual({ kind: 'dm', member: 'apLead' });
  expect(inGroup('Head of FP&A', 'People')[0].title).toBe('Mei Tachibana');
  expect(inGroup('Shun', 'People')[0].view).toEqual({ kind: 'channel', channel: 'close' });
  // Ren owns #cash and belongs to it.
  expect(inGroup('Ren Fujisawa', 'People')[0].view).toEqual({ kind: 'channel', channel: 'cash' });
});

test('results come in the groups’ order, and there’s no answer among them', () => {
  const order = groups('cut-off').map((g) => SEARCH_GROUPS.indexOf(g));
  expect(order).toEqual([...order].sort((a, b) => a - b));
});
