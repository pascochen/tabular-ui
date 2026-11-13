import { useSyncExternalStore } from 'react';

// The demo is built for a desktop, as AppShell is. These two widths are all it
// does for a smaller screen: enough to follow the story on a phone, not a phone
// layout. Tailwind's stock lg and sm.

/**
 * Under this the panel is a sheet (`shell/PanelSheet.tsx`). Docked, AppShell would narrow it toward its
 * 360px minimum to keep main at 600px (§7.9), and main would be narrower than a phone from 735px.
 */
const noRoomForPanelQuery = '(width < 64rem)';
/** Under this, the decision may land under the composer (`decision-in-view.ts`). */
const phoneQuery = '(width < 40rem)';

const subscribeTo = (query: string) => (onChange: () => void) => {
  const mql = matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const subscribeNoRoomForPanel = subscribeTo(noRoomForPanelQuery);

export function useNoRoomForPanel() {
  return useSyncExternalStore(subscribeNoRoomForPanel, () => matchMedia(noRoomForPanelQuery).matches);
}

/** Read once, for an effect that only runs on landing. */
export const isPhoneWidth = () => matchMedia(phoneQuery).matches;
