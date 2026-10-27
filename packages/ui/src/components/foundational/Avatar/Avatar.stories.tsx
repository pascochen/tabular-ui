import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar, AvatarFallback } from './index';

/**
 * Simplified to shadcn's demo while the Avatar's styling is reworked:
 * initials only, no image. Mode is driven by the toolbar Theme control.
 */
const meta = {
  title: 'Foundational/Avatar',
  component: Avatar,
  parameters: { layout: 'padded' },
  args: { size: 'default' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'default'] } },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>MT</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `sm` (24px) and `default` (32px). */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-[var(--gap-group)]">
      <Avatar size="sm">
        <AvatarFallback>MT</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MT</AvatarFallback>
      </Avatar>
    </div>
  ),
};
