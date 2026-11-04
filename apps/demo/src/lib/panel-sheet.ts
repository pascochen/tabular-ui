import { createContext, useContext } from 'react';

/**
 * Opens the right panel where it's a dialog (`shell/PanelSheet.tsx`). A row that
 * selects what the panel shows calls it: that's the visitor asking for the panel,
 * which is the only way it opens. It never opens on load. Beside main it does
 * nothing, since the panel is already there.
 */
export const PanelSheetContext = createContext<() => void>(() => {});

export const usePanelSheet = () => useContext(PanelSheetContext);
