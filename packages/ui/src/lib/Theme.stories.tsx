import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/foundational/Select';
import { Field } from '../components/product/Field';
import { useTheme, type ThemePreference } from './theme';

const labels: Record<ThemePreference, string> = { system: 'System', dark: 'Dark', light: 'Light' };

/**
 * `useTheme` in an app's settings: the user picks System, Dark or Light, and
 * the hook sets `data-theme` on the root. The story starts in the mode the
 * toolbar set, so it shows that mode until you choose.
 */
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
        Mode in effect: {theme}
      </p>
    </div>
  );
}

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
