// The close as it stands: each exception's status and replies, the decision log and each
// check's figure. One state object; the close panel, the tiles and the counts are derived
// from it, never stored (kasane-close-demo-plan.md §5). Phase 5 and 6 add the actions that
// change it: the visitor's decision, and the scripted background resolutions.

import { checks, close } from './kasane';

export type ExceptionId = (typeof close.exceptions)[number]['id'];
export type ExceptionStatus = 'open' | 'resolved';

export type Reply = { author: string; text: string; at: string };

export type ExceptionState = {
  status: ExceptionStatus;
  replies: Reply[];
};

export type LogEntry = { at: string; exception: ExceptionId; text: string; by: string };

export type CloseState = {
  exceptions: Record<ExceptionId, ExceptionState>;
  /** Oldest first. */
  log: LogEntry[];
  /** Each check's current figure, by check id. */
  checks: Record<string, number>;
};

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
  return { exceptions, log, checks: Object.fromEntries(checks.map((c) => [c.id, c.before])) };
}

export type CloseAction = { type: 'reset' };

export function closeReducer(state: CloseState, action: CloseAction): CloseState {
  switch (action.type) {
    case 'reset':
      return landingState();
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
