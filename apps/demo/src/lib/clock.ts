import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';

import { close } from './kasane';

// The scene's clock: the visitor lands at close.scene.landingTime (14:00), and the clock runs
// on from there in real minutes. Every new message takes its time from it, so a reply posted
// two minutes in reads 14:02.

let startedAt = Date.now();

/** Starts the clock again at the landing time. Replay calls it (phase 6). */
export function restartClock() {
  startedAt = Date.now();
}

/** Now, in the scene, as the channel shows times: "14:02". */
export function sceneNow(): string {
  const [h, m] = close.scene.landingTime.split(':').map(Number);
  const total = h * 60 + m + Math.floor((Date.now() - startedAt) / 60000);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const subscribeReducedMotion = (onChange: () => void) => {
  const mql = matchMedia(reducedMotionQuery);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/** True when the visitor asked for reduced motion. Live: flipping the setting re-renders. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

/**
 * Runs `step` once, `ms` after `when` turns true, and never after the
 * component unmounts or `when` turns false. Under reduced motion it runs at
 * once: the plan applies scripted events without waiting (§5).
 */
export function useScriptedStep(when: boolean, ms: number, step: () => void) {
  const reduced = useReducedMotion();
  // An effect event: the timer fires the latest `step` without restarting
  // each time the caller renders a fresh closure.
  const run = useEffectEvent(step);
  useEffect(() => {
    if (!when) return;
    const timer = setTimeout(run, reduced ? 0 : ms);
    return () => clearTimeout(timer);
  }, [when, ms, reduced]);
}
