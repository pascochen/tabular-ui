import { expect, test } from '@playwright/test';

import {
  closeReducer,
  landingState,
  progress,
  type CloseAction,
  type CloseState,
} from '../../demo/src/lib/close-state';

/**
 * The close demo's decision, as state: what each answer the visitor can give
 * resolves, changes and logs (apps/demo/src/lib/close-state.ts). The panel,
 * the tiles and the sidebar count are all derived from this state, so if it
 * is right, they are.
 *
 * Nothing here needs a browser.
 */

const run = (...actions: CloseAction[]) => actions.reduce(closeReducer, landingState());
const hero = (s: CloseState) => s.exceptions['revenue-cut-off'];
const last = (s: CloseState) => s.hero.rounds[s.hero.rounds.length - 1];

test('the landing state: 2 of 6 resolved, the question asked, the cut-off at ¥42.7m', () => {
  const s = landingState();
  expect(progress(s)).toEqual({ resolved: 2, total: 6 });
  expect(s.hero.rounds).toEqual([{ askedAt: '13:49' }]);
  expect(s.checks['revenue-cut-off']).toBe(42720000);
  expect(s.log.map((l) => l.exception)).toEqual(['close-length', 'europe-on-plan']);
});

test('reopen: read, propose, post, rerun; only then resolved and tied out', () => {
  const proposed = run({ type: 'answer', answer: 'reopen', at: '14:00' }, { type: 'read' });
  expect(last(proposed).stage).toBe('proposed');
  const posted = closeReducer(proposed, { type: 'post', at: '14:01' });
  // Posted but not rerun: nothing is resolved or tied out yet.
  expect(last(posted).stage).toBe('rerunning');
  expect(hero(posted).status).toBe('open');
  expect(posted.checks['revenue-cut-off']).toBe(42720000);
  const done = closeReducer(posted, { type: 'rerun', at: '14:01' });
  expect(hero(done).status).toBe('resolved');
  expect(done.checks['revenue-cut-off']).toBe(0);
  expect(progress(done).resolved).toBe(3);
  expect(done.log.at(-1)).toMatchObject({ exception: 'revenue-cut-off', by: 'visitor', at: '14:01' });
});

test('keep September locked: resolved on posting, no rerun, the figure unchanged', () => {
  const done = run(
    { type: 'answer', answer: 'keep-locked', at: '14:00' },
    { type: 'read' },
    { type: 'post', at: '14:01' },
  );
  expect(last(done).stage).toBe('done');
  expect(hero(done).status).toBe('resolved');
  expect(done.checks['revenue-cut-off']).toBe(42720000);
  expect(done.log.at(-1)?.text).toMatch(/listed for the auditors/);
});

test("don't post: the round stops and the question is asked again", () => {
  const s = run({ type: 'answer', answer: 'reopen', at: '14:00' }, { type: 'read' }, { type: 'stop', at: '14:02' });
  expect(s.hero.rounds.map((r) => r.stage)).toEqual(['stopped', undefined]);
  expect(last(s)).toEqual({ askedAt: '14:02' });
  expect(hero(s).status).toBe('open');
});

test('choose for me takes the scripted option and says so', () => {
  const s = run({ type: 'answer', answer: 'delegate', at: '14:00' });
  expect(last(s)).toMatchObject({ answer: 'reopen', delegated: true, stage: 'reading' });
});

test('skip leaves the exception open, and the question is answered once', () => {
  const s = run({ type: 'answer', answer: 'skip', at: '14:00' }, { type: 'answer', answer: 'reopen', at: '14:01' });
  expect(last(s)).toMatchObject({ answer: 'skip', stage: 'skipped' });
  expect(hero(s).status).toBe('open');
});

test('a step out of order changes nothing: no post before the proposal, no double post', () => {
  const early = run({ type: 'answer', answer: 'reopen', at: '14:00' }, { type: 'post', at: '14:00' });
  expect(last(early).stage).toBe('reading');
  const twice = run(
    { type: 'answer', answer: 'keep-locked', at: '14:00' },
    { type: 'read' },
    { type: 'post', at: '14:01' },
    { type: 'post', at: '14:02' },
  );
  expect(twice.log.filter((l) => l.exception === 'revenue-cut-off')).toHaveLength(1);
});
