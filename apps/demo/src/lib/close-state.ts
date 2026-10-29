// The close as it stands: each exception's status and replies, the visitor's decision, the
// decision log and each check's figure. One state object; the close panel, the tiles and the
// counts are derived from it, never stored (kasane-close-demo-plan.md §5). Phase 6 adds the
// scripted background resolutions.

import { checks, close } from './kasane';

export type ExceptionId = (typeof close.exceptions)[number]['id'];
export type ExceptionStatus = 'open' | 'resolved';

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
  return {
    exceptions,
    hero: { rounds: [{ askedAt: close.hero.askedAt }] },
    log,
    checks: Object.fromEntries(checks.map((c) => [c.id, c.before])),
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
  | { type: 'rerun'; at: string };

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

export function closeReducer(state: CloseState, action: CloseAction): CloseState {
  const round = current(state);
  switch (action.type) {
    case 'reset':
      return landingState();
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
