// The close as it stands: each exception's status and replies, the visitor's decision, the
// teammates' scripted replies, the decision log and each check's figure. One state object; the
// close panel, the tiles and the counts are derived from it, never stored
// (kasane-close-demo-plan.md §5).

import { checks, close } from './kasane';
import { timeline } from './timeline';

export type ExceptionId = (typeof close.exceptions)[number]['id'];
/** `waiting`: nobody here can settle it; it waits on a decision outside the channel. */
export type ExceptionStatus = 'open' | 'resolved' | 'waiting';

export type Reply = { author: string; text: string; at: string };

export type ExceptionState = {
  status: ExceptionStatus;
  replies: Reply[];
};

export type LogEntry = { at: string; exception: ExceptionId; text: string; by: string };

export type HeroOption = 'reopen' | 'keep-locked';

/**
 * One time the agent asked the hero question. A round ends answered, skipped,
 * or stopped at the confirmation, and a stop asks again in a new round, so
 * the thread keeps what was said.
 */
export type HeroRound = {
  askedAt: string;
  /** Unset while the question waits. */
  answer?: HeroOption | 'skip';
  /** The visitor pressed "Choose for me". */
  delegated?: boolean;
  answeredAt?: string;
  /**
   * After an answer: reading the delivery note, then the proposal, then (for
   * a reopen) the check rerunning, then done. `stopped` is "Don't post it".
   */
  stage?: 'reading' | 'proposed' | 'rerunning' | 'done' | 'stopped' | 'skipped';
  postedAt?: string;
};

export type CloseState = {
  exceptions: Record<ExceptionId, ExceptionState>;
  hero: { rounds: HeroRound[] };
  /** Oldest first. */
  log: LogEntry[];
  /** Each check's current figure, by check id. */
  checks: Record<string, number>;
  /** How many of `timeline`'s events have applied. The next one to play is this index. */
  applied: number;
  /** A person typing now, by member key, or null. People only: the agent never types. */
  typing: string | null;
  /** The scripted run is over: the end strip shows. */
  ended: boolean;
  /** What the visitor wrote in the composer. Nobody replies to it. */
  posts: { text: string; at: string }[];
  /** The catch-up as of its last refresh: when, and how many were resolved then. */
  catchUp: { at: string; resolved: number; tiedOut: string[] };
};

const HERO = close.hero.exception as ExceptionId;

/**
 * The state a visitor lands on: what had happened before 14:00. A reply or
 * resolution with a clock time (`at`) is already in the channel; one with a
 * delay is scripted to arrive later.
 */
export function landingState(): CloseState {
  const exceptions = {} as CloseState['exceptions'];
  const log: LogEntry[] = [];
  for (const e of close.exceptions) {
    const replies = e.replies.flatMap((r) => ('at' in r && r.at ? [{ author: r.author, text: r.text, at: r.at }] : []));
    exceptions[e.id] = { status: e.atLanding === 'resolved' ? 'resolved' : 'open', replies };
    if (e.atLanding === 'resolved' && e.resolution && 'at' in e.resolution && e.resolution.at) {
      log.push({ at: e.resolution.at, exception: e.id, text: e.resolution.log, by: e.resolution.by });
    }
  }
  log.sort((a, b) => a.at.localeCompare(b.at));
  const base = {
    exceptions,
    hero: { rounds: [{ askedAt: close.hero.askedAt }] },
    log,
    checks: Object.fromEntries(checks.map((c) => [c.id, c.before])),
    applied: 0,
    typing: null,
    ended: false,
    posts: [],
  };
  return { ...base, catchUp: snapshot(base, close.scene.landingTime) };
}

/** The end state: the decision made (Reopen, as Choose for me picks) and every event applied. `?at=end` opens here. */
export function endState(at: string): CloseState {
  return closeReducer(landingState(), { type: 'skip', at });
}

function snapshot(state: Pick<CloseState, 'exceptions' | 'checks'>, at: string): CloseState['catchUp'] {
  return {
    at,
    resolved: Object.values(state.exceptions).filter((e) => e.status === 'resolved').length,
    tiedOut: checks.filter((c) => state.checks[c.id] === c.after).map((c) => c.id),
  };
}

export type CloseAction =
  | { type: 'reset' }
  /** The visitor answered the hero question: an option, Skip, or Choose for me. */
  | { type: 'answer'; answer: HeroOption | 'skip' | 'delegate'; at: string }
  /** The agent finished reading the delivery note and posts its proposal. */
  | { type: 'read' }
  /** The visitor confirmed the proposal. */
  | { type: 'post'; at: string }
  /** The visitor declined it: the agent asks again. */
  | { type: 'stop'; at: string }
  /** The revenue cut-off check finished rerunning. */
  | { type: 'rerun'; at: string }
  /** The next background event, by its index in `timeline`. `quiet` drops a typing indicator (reduced motion). */
  | { type: 'event'; index: number; at: string; quiet?: boolean }
  /** Skip to the end: finish the decision if it's open, then apply every event left. */
  | { type: 'skip'; at: string }
  /** Refresh the catch-up to now. */
  | { type: 'refresh'; at: string }
  /** The visitor posted in the composer. */
  | { type: 'say'; text: string; at: string };

const current = (state: CloseState) => state.hero.rounds[state.hero.rounds.length - 1];

function withRound(state: CloseState, patch: Partial<HeroRound>, next?: HeroRound): CloseState {
  const rounds = state.hero.rounds.slice(0, -1);
  rounds.push({ ...current(state), ...patch });
  if (next) rounds.push(next);
  return { ...state, hero: { rounds } };
}

function resolveHero(state: CloseState, at: string, log: string): CloseState {
  return {
    ...state,
    exceptions: { ...state.exceptions, [HERO]: { ...state.exceptions[HERO], status: 'resolved' } },
    log: [...state.log, { at, exception: HERO, text: log, by: 'visitor' }],
  };
}

function applyEvent(state: CloseState, index: number, at: string, quiet: boolean): CloseState {
  if (index !== state.applied || index >= timeline.length) return state;
  const next = { ...state, applied: index + 1 };
  const effect = timeline[index].effect;
  switch (effect.kind) {
    case 'typing':
      return quiet ? next : { ...next, typing: effect.who };
    case 'reply': {
      const id = effect.exception as ExceptionId;
      const e = next.exceptions[id];
      return {
        ...next,
        typing: next.typing === effect.author ? null : next.typing,
        exceptions: {
          ...next.exceptions,
          [id]: { ...e, replies: [...e.replies, { author: effect.author, text: effect.text, at }] },
        },
      };
    }
    case 'resolve': {
      const id = effect.exception as ExceptionId;
      return {
        ...next,
        exceptions: { ...next.exceptions, [id]: { ...next.exceptions[id], status: 'resolved' } },
        log: [...next.log, { at, exception: id, text: effect.log, by: effect.by }],
      };
    }
    case 'wait': {
      const id = effect.exception as ExceptionId;
      return { ...next, exceptions: { ...next.exceptions, [id]: { ...next.exceptions[id], status: 'waiting' } } };
    }
    case 'end':
      return { ...next, typing: null, ended: true };
  }
}

/** Whether the visitor's decision has settled, which starts the background. */
export function decided(state: CloseState): boolean {
  const stage = current(state).stage;
  return stage === 'done' || stage === 'skipped';
}

export function closeReducer(state: CloseState, action: CloseAction): CloseState {
  const round = current(state);
  switch (action.type) {
    case 'reset':
      return landingState();
    case 'event':
      return applyEvent(state, action.index, action.at, action.quiet ?? false);
    case 'skip': {
      // Finish the decision from wherever it stands, as the visitor would have.
      let s = state;
      const step = (a: CloseAction) => (s = closeReducer(s, a));
      if (!current(s).answer) step({ type: 'answer', answer: 'delegate', at: action.at });
      if (current(s).stage === 'reading') step({ type: 'read' });
      if (current(s).stage === 'proposed') step({ type: 'post', at: action.at });
      if (current(s).stage === 'rerunning') step({ type: 'rerun', at: action.at });
      while (s.applied < timeline.length) s = applyEvent(s, s.applied, action.at, true);
      return { ...s, catchUp: snapshot(s, action.at) };
    }
    case 'refresh':
      return { ...state, catchUp: snapshot(state, action.at) };
    case 'say':
      return action.text.trim()
        ? { ...state, posts: [...state.posts, { text: action.text.trim(), at: action.at }] }
        : state;
    case 'answer': {
      if (round.answer) return state;
      if (action.answer === 'skip')
        return withRound(state, { answer: 'skip', answeredAt: action.at, stage: 'skipped' });
      const delegated = action.answer === 'delegate';
      const answer = delegated ? (close.hero.delegate.option as HeroOption) : (action.answer as HeroOption);
      return withRound(state, { answer, delegated, answeredAt: action.at, stage: 'reading' });
    }
    case 'read':
      return round.stage === 'reading' ? withRound(state, { stage: 'proposed' }) : state;
    case 'stop':
      return round.stage === 'proposed' ? withRound(state, { stage: 'stopped' }, { askedAt: action.at }) : state;
    case 'post': {
      if (round.stage !== 'proposed') return state;
      if (round.answer === 'reopen') return withRound(state, { stage: 'rerunning', postedAt: action.at });
      // Keeping September locked posts nothing, so no check reruns: the
      // decision itself resolves the exception.
      return resolveHero(withRound(state, { stage: 'done', postedAt: action.at }), action.at, close.hero.record.log);
    }
    case 'rerun': {
      if (round.stage !== 'rerunning') return state;
      const after = checks.find((c) => c.id === HERO)!.after;
      const next = resolveHero(withRound(state, { stage: 'done' }), action.at, close.hero.entry.log);
      return { ...next, checks: { ...next.checks, [HERO]: after } };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Derived
// ---------------------------------------------------------------------------

export function progress(state: CloseState) {
  const all = Object.values(state.exceptions);
  return { resolved: all.filter((e) => e.status === 'resolved').length, total: all.length };
}

/** A check's figure as shown: the generated label for the before or after value. */
export function checkLabel(state: CloseState, id: string): string {
  const c = checks.find((x) => x.id === id)!;
  return state.checks[id] === c.after ? c.afterLabel : c.beforeLabel;
}

export function isTiedOut(state: CloseState, id: string): boolean {
  return state.checks[id] === checks.find((x) => x.id === id)!.after;
}
