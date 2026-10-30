import { useEffect, useEffectEvent, useSyncExternalStore, type Dispatch } from 'react';

import { sceneNow, useReducedMotion } from './clock';
import { decided, type CloseAction, type CloseState } from './close-state';
import { timeline } from './timeline';

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};

/** True while the tab is visible. Live. */
function useDocumentVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  );
}

/**
 * Plays the background once the visitor's decision settles: one event at a
 * time, each `gap` ms after the last, in `timeline`'s fixed order.
 *
 * - **Pauses while the tab is hidden.** The pending event's wait starts over
 *   when the tab comes back, so nothing plays to an empty room.
 * - **Under reduced motion** every event applies at once, and typing
 *   indicators are dropped.
 * - **No timer outlives it.** One timer at a time, cleared on every state
 *   change and on unmount; Replay (a `reset`) puts `applied` back to 0.
 */
export function useTimeline(state: CloseState, dispatch: Dispatch<CloseAction>) {
  const visible = useDocumentVisible();
  const reduced = useReducedMotion();
  const running = decided(state) && !state.ended && visible;
  const index = state.applied;
  const fire = useEffectEvent(() => {
    const quiet = reduced && timeline[index]?.effect.kind === 'typing';
    dispatch({ type: 'event', index, at: sceneNow(), quiet });
  });
  useEffect(() => {
    if (!running || index >= timeline.length) return;
    const timer = setTimeout(fire, reduced ? 0 : timeline[index].gap);
    return () => clearTimeout(timer);
  }, [running, index, reduced]);
}
