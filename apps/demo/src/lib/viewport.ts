import { useSyncExternalStore } from 'react';

// The demo is built for a desktop, as AppShell is. These two widths are all it
// does for a smaller screen: enough to follow the story on a phone, not a phone
// layout. Tailwind's stock lg and sm.

/** Under this, main beside the 440px panel is under 584px, and narrower than a phone from 815px (`shell/PanelSheet.tsx`). */
const noRoomForPanelQuery = '(width < 64rem)';
/** Under this, the demo bar's full labels don't fit (`DemoBanner`). */
const compactBarQuery = '(width < 40rem)';

const subscribeTo = (query: string) => (onChange: () => void) => {
  const mql = matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const subscribeNoRoomForPanel = subscribeTo(noRoomForPanelQuery);
const subscribeCompactBar = subscribeTo(compactBarQuery);

export function useNoRoomForPanel() {
  return useSyncExternalStore(subscribeNoRoomForPanel, () => matchMedia(noRoomForPanelQuery).matches);
}

export function useCompactBar() {
  return useSyncExternalStore(subscribeCompactBar, () => matchMedia(compactBarQuery).matches);
}
