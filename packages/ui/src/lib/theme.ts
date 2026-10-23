import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';

/**
 * The colour mode, applied as `data-theme` on the root. Every token in
 * `src/styles/theme.css` switches on it: `:root` is light and
 * `[data-theme="dark"]` is dark, so a page that never sets it renders light,
 * in a dark-first system, with no error.
 */
export type ThemeMode = 'dark' | 'light';

/** What the user chose. `system` follows the OS setting, live. */
export type ThemePreference = ThemeMode | 'system';

export type UseThemeOptions = {
  /**
   * Used until the user chooses. Defaults to `dark`: the system is dark-first
   * (`CLAUDE.md`), and the OS setting is opt-in, not assumed. Match the
   * `data-theme` your `index.html` ships with, or the page changes mode on
   * load.
   */
  defaultPreference?: ThemePreference;
  /**
   * Where the user's choice is remembered, in `localStorage`. `null` keeps it
   * for this page load only. Storage that is blocked or full is ignored: the
   * mode still applies, it just isn't remembered.
   */
  storageKey?: string | null;
};

const prefersDarkQuery = '(prefers-color-scheme: dark)';
const subscribePrefersDark = (onChange: () => void) => {
  const mql = matchMedia(prefersDarkQuery);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'dark' || value === 'light' || value === 'system';

function readStored(key: string): ThemePreference | null {
  try {
    const value = localStorage.getItem(key);
    return isPreference(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: ThemePreference) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice applies, unremembered.
  }
}

/** The mode a preference comes to, given whether the OS asks for dark. */
export function resolveTheme(preference: ThemePreference, osPrefersDark: boolean): ThemeMode {
  if (preference === 'system') return osPrefersDark ? 'dark' : 'light';
  return preference;
}

/**
 * The one place an app sets its colour mode. Call it once, in the app's root
 * component; it owns `data-theme` on `<html>` from then on. Returns the mode
 * in effect, the user's preference, and a setter, which is what
 * `AccountMenu`'s `theme` / `onThemeChange` take.
 *
 * ```tsx
 * const { theme, setPreference } = useTheme();
 * <AccountMenu theme={theme} onThemeChange={setPreference} … />
 * ```
 */
export function useTheme({ defaultPreference = 'dark', storageKey = 'tui-theme' }: UseThemeOptions = {}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => (storageKey ? readStored(storageKey) : null) ?? defaultPreference,
  );
  const osPrefersDark = useSyncExternalStore(
    subscribePrefersDark,
    () => matchMedia(prefersDarkQuery).matches,
    () => true,
  );
  const theme = resolveTheme(preference, osPrefersDark);

  // Layout effect, so the mode lands before the first paint React controls.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      if (storageKey) writeStored(storageKey, next);
    },
    [storageKey],
  );

  return { theme, preference, setPreference };
}
