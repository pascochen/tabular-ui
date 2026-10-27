import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/foundational/Select';
import { Field } from '../components/product/Field';
import { useTheme, type ThemePreference } from './theme';

const labels: Record<ThemePreference, string> = { system: 'System', dark: 'Dark', light: 'Light' };

function ThemeSetting({ storageKey }: { storageKey: string | null }) {
  const [initial] = useState<ThemePreference>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  );
  const { theme, preference, setPreference } = useTheme({ defaultPreference: initial, storageKey });
  return (
    <div className="flex w-80 flex-col gap-[var(--gap-field)]">
      <Field label="Theme" help="System follows your operating system's setting.">
        {(p) => (
          <Select items={labels} value={preference} onValueChange={(next) => setPreference(next as ThemePreference)}>
            <SelectTrigger id={p.id} aria-describedby={p['aria-describedby']}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>
        )}
      </Field>
      <p className="text-base text-text-secondary" data-testid="mode-in-effect">
        The page is in {theme} mode.
      </p>
    </div>
  );
}

/**
 * Without `useTheme()`, an app renders in light mode, in a dark-first system,
 * and nothing errors. The hook is what sets the colour mode.
 *
 * Call it once, in the app's root component. It owns `data-theme` on `<html>`
 * from then on. Its `preference` and `setPreference` are what `AccountMenu`'s
 * `theme` and `onThemeChange` take. Put the same mode in `index.html`
 * (`<html data-theme="dark">`), so the page does not switch modes on load.
 *
 * Below, the hook drives a theme setting, which starts in the toolbar's mode.
 */
const meta = {
  title: 'Lib/useTheme',
  component: ThemeSetting,
  parameters: { layout: 'padded' },
  // Not remembered by default: a choice stored here would override the
  // toolbar on the next visit. tests/theme.spec.ts passes a key to test it.
  args: { storageKey: null },
} satisfies Meta<typeof ThemeSetting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
