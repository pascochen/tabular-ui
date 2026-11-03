import { expect, test } from '@playwright/test';

import {
  awaitsVisitor,
  closeReducer,
  isReopened,
  landingState,
  progress,
  type CloseAction,
  type CloseState,
} from '../../demo/src/lib/close-state';
import { timeline } from '../../demo/src/lib/timeline';

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

test('the landing state: 0 of 4 resolved, the question asked, the cut-off at ¥42.7m', () => {
  const s = landingState();
  expect(progress(s)).toEqual({ resolved: 0, total: 4 });
  expect(Object.values(s.exceptions).map((e) => e.status)).toEqual(['open', 'open', 'open', 'open']);
  expect(s.hero.rounds).toEqual([{ askedAt: '13:49' }]);
  expect(s.checks['revenue-cut-off']).toBe(42720000);
  expect(s.log).toEqual([]);
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
  expect(progress(done).resolved).toBe(1);
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

test('September reads as reopened only once the reversal is posted, and Start over locks it again', () => {
  const proposed = run({ type: 'answer', answer: 'reopen', at: '14:00' }, { type: 'read' });
  expect(isReopened(proposed)).toBe(false);
  const posted = closeReducer(proposed, { type: 'post', at: '14:01' });
  expect(isReopened(posted)).toBe(true);
  expect(isReopened(closeReducer(posted, { type: 'reset' }))).toBe(false);
  // Keeping it locked never reads as reopened, nor does stopping at the confirmation.
  expect(
    isReopened(
      run({ type: 'answer', answer: 'keep-locked', at: '14:00' }, { type: 'read' }, { type: 'post', at: '14:01' }),
    ),
  ).toBe(false);
  expect(isReopened(closeReducer(proposed, { type: 'stop', at: '14:01' }))).toBe(false);
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

// ---------------------------------------------------------------------------
// The timeline: the teammates' side, after the decision
// ---------------------------------------------------------------------------

const playAll = (s: CloseState) => {
  let out = s;
  for (let i = 0; i < timeline.length; i++) out = closeReducer(out, { type: 'event', index: i, at: '14:05' });
  return out;
};

test('the timeline is one fixed order, ending once, with the gaps it was scripted with', () => {
  expect(timeline.at(-1)?.effect.kind).toBe('end');
  expect(timeline.filter((e) => e.effect.kind === 'end')).toHaveLength(1);
  for (const e of timeline) expect(e.gap).toBeGreaterThanOrEqual(0);
  // People type before they post, and the agent never types.
  const typing = timeline.flatMap((e) => (e.effect.kind === 'typing' ? [e.effect.who] : []));
  expect(typing).not.toContain('agent');
  expect(typing.length).toBe(timeline.filter((e) => e.effect.kind === 'reply').length);
});

test('played after a reopen: 3 of 4 resolved, the credit limit waiting, the end reached', () => {
  const s = playAll(
    run(
      { type: 'answer', answer: 'reopen', at: '14:00' },
      { type: 'read' },
      { type: 'post', at: '14:01' },
      { type: 'rerun', at: '14:01' },
    ),
  );
  expect(progress(s).resolved).toBe(3);
  expect(s.exceptions['credit-limit'].status).toBe('waiting');
  expect(s.ended).toBe(true);
  expect(s.typing).toBeNull();
  expect(s.exceptions['duplicate-payment'].replies).toHaveLength(2);
});

test('an event applies once, and only in order', () => {
  const s = closeReducer(landingState(), { type: 'event', index: 1, at: '14:00' });
  expect(s.applied).toBe(0);
  const once = closeReducer(closeReducer(landingState(), { type: 'event', index: 0, at: '14:00' }), {
    type: 'event',
    index: 0,
    at: '14:00',
  });
  expect(once.applied).toBe(1);
});

test('quiet events (reduced motion) never show a typing indicator', () => {
  let s = landingState();
  for (let i = 0; i < timeline.length; i++) {
    s = closeReducer(s, { type: 'event', index: i, at: '14:05', quiet: true });
    expect(s.typing).toBeNull();
  }
});

test('skip from landing finishes the decision as Choose for me would, then plays everything', () => {
  const s = closeReducer(landingState(), { type: 'skip', at: '14:00' });
  expect(last(s)).toMatchObject({ answer: 'reopen', delegated: true, stage: 'done' });
  expect(s.checks['revenue-cut-off']).toBe(0);
  expect(s.ended).toBe(true);
  expect(progress(s).resolved).toBe(3);
});

test('the self-approved entry resolves in a teammate’s name, never the visitor’s', () => {
  // D2: left on Daisuke, the timeline would resolve it in the visitor's name while he does nothing.
  const s = closeReducer(landingState(), { type: 'skip', at: '14:00' });
  expect(s.log.find((l) => l.exception === 'self-approved-entry')?.by).toBe('glAccountant');
});

test('skip keeps an answer the visitor gave: a skipped question stays open', () => {
  const s = run({ type: 'answer', answer: 'skip', at: '14:00' }, { type: 'skip', at: '14:01' });
  expect(hero(s).status).toBe('open');
  expect(progress(s).resolved).toBe(2);
  expect(s.ended).toBe(true);
});

test('replay starts over from landing', () => {
  const s = closeReducer(closeReducer(landingState(), { type: 'skip', at: '14:00' }), { type: 'reset' });
  expect(s).toEqual(landingState());
});

test('the decision awaits the visitor until it is answered, and nothing else does', () => {
  const s = landingState();
  expect(Object.keys(s.exceptions).filter((id) => awaitsVisitor(s, id))).toEqual(['revenue-cut-off']);
  const answered = closeReducer(s, { type: 'answer', answer: 'keep-locked', at: '14:00' });
  expect(awaitsVisitor(answered, 'revenue-cut-off')).toBe(false);
  // After "Don't post it" the agent asks again, so it is the visitor's again.
  const asked = closeReducer(closeReducer(answered, { type: 'read' }), { type: 'stop', at: '14:01' });
  expect(awaitsVisitor(asked, 'revenue-cut-off')).toBe(true);
});

test('each typing indicator names the card its reply lands on', () => {
  timeline.forEach((e, i) => {
    if (e.effect.kind !== 'typing') return;
    const { who, exception } = e.effect;
    const reply = timeline.slice(i + 1).find((x) => x.effect.kind === 'reply' && x.effect.author === who);
    expect(reply?.effect, `${who} typing at event ${i}`).toMatchObject({ exception });
  });
  const s = closeReducer(landingState(), { type: 'event', index: 0, at: '14:00' });
  expect(s.typing).toEqual({ who: 'apLead', exception: 'duplicate-payment' });
});
