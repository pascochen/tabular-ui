import { createContext, useContext } from 'react';

/**
 * Separate module so index.tsx exports only components — react-refresh
 * disables fast refresh for any file mixing components with other exports.
 */

/** What the regions' content can read about the shell. */
export type AppShellState = {
  /**
   * Whether the sidebar is pinned open. The top nav reads this to decide
   * what its breadcrumb carries: pinned, company and project are already in
   * the sidebar; collapsed, the breadcrumb takes them over. A hover peek does
   * not count — it is a transient overlay, and the breadcrumb must not
   * reflow under the pointer.
   */
  sidebarOpen: boolean;
  /** Pins or unpins the sidebar. */
  toggleSidebar: () => void;
  /** Whether the trailing panel (the chat drawer) is open. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  /** For `aria-controls` on whatever opens the panel — the top nav's Chat button. */
  panelId: string;
};

/** `AppShell`'s `contentWidth`: whether main's column is capped at --w-content (§7.9). */
export type AppShellContentWidth = 'contained' | 'full';

export type AppShellContextValue = AppShellState & {
  /** Read by `AppShellPageHeader`, so the title keeps the body's gutter. */
  contentWidth: AppShellContentWidth;
  hasSidebar: boolean;
  sidebarId: string;
  /** Callback ref for the top-nav toggle — focus lands on it after unpinning. */
  registerToggle: (el: HTMLButtonElement | null) => void;
  /** Hover-to-peek, wired onto the top-nav toggle. Enter arms; a real move opens. */
  onTogglePointerEnter: (event: React.PointerEvent) => void;
  onTogglePointerMove: (event: React.PointerEvent) => void;
  onTogglePointerLeave: () => void;
};

export const AppShellContext = createContext<AppShellContextValue | null>(null);

/**
 * Reads the enclosing shell's state. For region content that has to respond
 * to the layout — a breadcrumb that grows when the sidebar collapses, a Chat
 * button that toggles the panel.
 */
export function useAppShell(): AppShellState {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useAppShell must be called inside <AppShell>.');
  return ctx;
}
