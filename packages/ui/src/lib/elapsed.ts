import { useEffect, useState } from 'react';

/** A working label shows its figure from this many seconds (§11.5). Below it, the figure is noise. */
export const ELAPSED_AFTER_SECONDS = 3;

/** `m:ss`, so the figure keeps one width for its first ten minutes. */
export function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Whole seconds since `startedAt` (epoch ms), live. Without it, since the
 * calling component mounted. Pass it whenever the caller knows when the work
 * began: a reload mid-run then carries on rather than restarting at 0:00.
 *
 * Polls four times a second so the figure turns over close to the real
 * second, and re-renders only when the whole second changes.
 */
export function useElapsedSeconds(startedAt?: number) {
  const [mountedAt] = useState(() => Date.now());
  const origin = startedAt ?? mountedAt;
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.floor((Date.now() - origin) / 1000)));
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - origin) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [origin]);
  return seconds;
}
