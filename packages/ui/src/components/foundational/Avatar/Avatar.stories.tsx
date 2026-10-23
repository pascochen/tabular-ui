import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import avatarAnimatedUrl from './fixtures/avatar-animated.svg';
import avatarUrl from './fixtures/avatar.svg';
import { Avatar, AvatarFallback, AvatarImage } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Avatar',
  component: Avatar,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `sm` (24px) and `default` (32px), image and initials. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-[var(--gap-group)]">
      {(['sm', 'default'] as const).map((size) => (
        <div key={size} className="flex items-center gap-[var(--gap-inline)]">
          <Avatar size={size}>
            <AvatarImage src={avatarUrl} alt="Mei Tachibana" />
            <AvatarFallback>MT</AvatarFallback>
          </Avatar>
          <Avatar size={size}>
            <AvatarFallback>MT</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  ),
};

/**
 * `animatedSrc` plays only while `animate` is true. Hover the avatar here;
 * under reduced motion it never plays.
 */
export const Animated: Story = {
  render: function AnimatedStory() {
    const [hover, setHover] = useState(false);
    return (
      <div className="inline-flex" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
        <Avatar>
          <AvatarImage src={avatarUrl} animatedSrc={avatarAnimatedUrl} animate={hover} alt="Mei Tachibana" />
          <AvatarFallback>MT</AvatarFallback>
        </Avatar>
      </div>
    );
  },
};

/** A broken image falls back to initials. */
export const BrokenImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/does-not-exist.png" alt="Mei Tachibana" />
      <AvatarFallback>MT</AvatarFallback>
    </Avatar>
  ),
};
