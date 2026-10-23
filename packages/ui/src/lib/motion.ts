import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void) => {
  const mql = matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/**
 * True when the user asked for reduced motion. Live: flipping the OS setting
 * re-renders. For motion CSS cannot reach — a JS smooth scroll, a scripted
 * playback. CSS motion uses `motion-safe:` / `motion-reduce:` instead.
 *
 * `Avatar` keeps its own copy; it predates this file.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );
}
