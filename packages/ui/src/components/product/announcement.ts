import { useEffect, useRef, useState } from 'react';

/**
 * How long an announcement stays in the live region before it is cleared, as
 * react-aria's announcer does. Long enough for a screen reader to queue it.
 */
export const ANNOUNCEMENT_MS = 7000;

/**
 * The live region's text: the announcement when the state changes, then
 * nothing. Left in place, it repeated the label beside it to anyone reading
 * the transcript ("Thought for 2s, Thought for 2s"). A part that mounts
 * already done, as a reopened thread's do, announces nothing: there was no
 * change to report. Shared by `AgentReasoning` and `Tool`.
 *
 * An empty `message` announces nothing, so a caller can pass `''` for a state
 * that isn't news.
 */
export function useAnnouncement(message: string, initiallyDone: boolean) {
  const [live, setLive] = useState('');
  // The message a done part mounted with, which is not news. Compared, not a
  // one-shot flag: development mode runs effects twice, and a flag would let
  // the second run announce it.
  const mountedWith = useRef(initiallyDone ? message : null);
  useEffect(() => {
    if (message === mountedWith.current) return;
    mountedWith.current = null;
    // Set in a frame, not synchronously: the region must exist empty before
    // its text arrives, or a screen reader may not treat it as a change.
    const show = requestAnimationFrame(() => setLive(message));
    const clear = setTimeout(() => setLive(''), ANNOUNCEMENT_MS);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(clear);
    };
  }, [message]);
  return live;
}
