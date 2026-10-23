import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { people } from '../../../fixtures/kasane';
import { useTheme } from '../../../lib/theme';
import { AccountMenu, type AccountUser } from './index';
import avatarAnimatedUrl from '../../foundational/Avatar/fixtures/avatar-animated.svg';
import avatarUrl from '../../foundational/Avatar/fixtures/avatar.svg';

/** Mode starts from the toolbar Theme control; the menu's Theme group changes it. */
const meta = {
  title: 'Product/AccountMenu',
  component: AccountMenu,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Kasane's Head of FP&A, the persona the product is built around. */
const mei: AccountUser = {
  name: people.fpa.name,
  shortName: people.fpa.shortName,
  email: people.fpa.email,
  avatarSrc: avatarUrl,
  avatarAnimatedSrc: avatarAnimatedUrl,
  initials: people.fpa.initials,
};

const handlers = {
  onThemeChange: () => {},
  onOpenProfile: () => {},
  onOpenWorkspaceSettings: () => {},
  onOpenBilling: () => {},
  onOpenHomepage: () => {},
  onSignOut: () => {},
};

/**
 * The footer band as `AppShell` renders it: 240px, the sidebar's ground, a
 * top rule, the `--pad-page-x` gutter. The Theme group goes through
 * `useTheme`, as an app's would: the hook owns `data-theme` on the root. It
 * starts from the toolbar's mode and doesn't remember the choice here, so
 * the toolbar still rules on the next visit.
 */
function Footer({ user }: { user: AccountUser }) {
  const [initial] = useState<'dark' | 'light'>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  );
  const { preference, setPreference } = useTheme({ defaultPreference: initial, storageKey: null });
  return (
    // Pinned to the bottom of the viewport, as in the sidebar: the menu opens upward.
    <div className="flex h-dvh items-end">
      <div className="w-60 border-t border-border bg-surface px-[var(--pad-page-x)] py-2">
        <AccountMenu {...handlers} user={user} theme={preference} onThemeChange={setPreference} />
      </div>
    </div>
  );
}

/** Hover the row to play the avatar; open the menu for the always-playing header avatar. */
export const Default: Story = {
  args: { user: mei, theme: 'dark', ...handlers },
  render: () => <Footer user={mei} />,
};

/** No image: initials on a neutral ground. */
export const Initials: Story = {
  args: { user: { ...mei, avatarSrc: undefined, avatarAnimatedSrc: undefined }, theme: 'dark', ...handlers },
  render: () => <Footer user={{ ...mei, avatarSrc: undefined, avatarAnimatedSrc: undefined }} />,
};

/** A long name truncates at the band's edge; the menu header truncates both lines. */
export const LongName: Story = {
  args: { user: mei, theme: 'dark', ...handlers },
  render: () => (
    <Footer
      user={{
        ...mei,
        // Kasane Europe's contracts coordinator: the longest name in the group.
        name: people.longName.name,
        shortName: people.longName.name,
        email: people.longName.email,
        initials: people.longName.initials,
      }}
    />
  ),
};
