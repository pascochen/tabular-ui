// The scripted background: what the visitor's teammates do once the visitor has decided.
// One list, in one fixed order, so every run plays the same (kasane-close-demo-plan.md §5).
// Each event fires `gap` ms after the one before it; `lib/close-state.ts` applies them by
// index, so an event can't apply twice, and Skip applies whatever is left.

import { close } from './kasane';

export type TimelineEffect =
  | { kind: 'typing'; who: string }
  | { kind: 'reply'; exception: string; author: string; text: string }
  | { kind: 'resolve'; exception: string; by: string; log: string }
  | { kind: 'wait'; exception: string }
  | { kind: 'end' };

export type TimelineEvent = { gap: number; effect: TimelineEffect };

/** After the last scripted event, how long until the end strip. */
const END_PAUSE_MS = 2000;

function build(): TimelineEvent[] {
  // Every scripted step, at its time after the decision (the `delayMs` in close.json).
  const timed: { at: number; effect: TimelineEffect }[] = [];
  for (const e of close.exceptions) {
    for (const r of e.replies) {
      if (!('delayMs' in r) || r.delayMs === undefined) continue;
      // A person types before they post; the agent never "types" (docs/agent-voice.md).
      timed.push({ at: Math.max(0, r.delayMs - close.typingMs), effect: { kind: 'typing', who: r.author } });
      timed.push({ at: r.delayMs, effect: { kind: 'reply', exception: e.id, author: r.author, text: r.text } });
    }
    if (e.resolution && 'delayMs' in e.resolution && e.resolution.delayMs !== undefined) {
      timed.push({
        at: e.resolution.delayMs,
        effect: { kind: 'resolve', exception: e.id, by: e.resolution.by, log: e.resolution.log },
      });
    }
    if ('waiting' in e && e.waiting) {
      const last = Math.max(0, ...e.replies.map((r) => ('delayMs' in r && r.delayMs) || 0));
      timed.push({ at: last, effect: { kind: 'wait', exception: e.id } });
    }
  }
  // Stable: equal times keep the order above (replies before resolutions).
  timed.sort((a, b) => a.at - b.at);
  const end = (timed.at(-1)?.at ?? 0) + END_PAUSE_MS;
  timed.push({ at: end, effect: { kind: 'end' } });
  return timed.map((t, i) => ({ gap: t.at - (i ? timed[i - 1].at : 0), effect: t.effect }));
}

export const timeline: readonly TimelineEvent[] = build();
