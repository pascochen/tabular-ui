import { createContext, useContext, type Dispatch } from 'react';

import type { CloseAction, CloseState } from './close-state';

export const CloseContext = createContext<{ state: CloseState; dispatch: Dispatch<CloseAction> } | null>(null);

/** The close's state and its dispatch. `App` provides them. */
export function useClose() {
  const value = useContext(CloseContext);
  if (!value) throw new Error('useClose needs CloseContext.Provider, which App renders');
  return value;
}
