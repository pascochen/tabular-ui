import type { Meta, StoryObj } from '@storybook/react-vite';

import { people } from '../../../fixtures/kasane';

import { Avatar, AvatarFallback } from './index';

/**
 * Simplified to shadcn's demo while the Avatar's styling is reworked:
 * one letter, no image. Mode is driven by the toolbar Theme control.
 */
const meta = {
  title: 'Foundational/Avatar',
  component: Avatar,
  parameters: { layout: 'padded' },
  args: { size: 'default' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'default'] } },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>J</AvatarFallback>
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
        <AvatarFallback>J</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>J</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/** A workspace's member list, in order. The fifth person starts the grounds again. */
const team = [people.controller, people.fpa, people.payables, people.ceo, people.treasury];

/**
 * §1 "Identity colour": a person's fallback is one letter on a tint. `identity`
 * is their position in the member list, and the four grounds (lake, ochre,
 * teal, ivy) repeat after the fourth. The last avatar has no `identity`, as an
 * agent's or the system's wouldn't: it stays neutral.
 */
export const Identity: Story = {
  render: () => (
    <div className="flex flex-col gap-[var(--gap-group)]">
      {(['sm', 'default'] as const).map((size) => (
        <div key={size} className="flex items-center gap-[var(--gap-inline)]">
          {team.map((p, i) => (
            <Avatar key={p.id} size={size} role="img" aria-label={p.name}>
              <AvatarFallback identity={i + 1}>{p.initials}</AvatarFallback>
            </Avatar>
          ))}
          <Avatar size={size} role="img" aria-label="No known person">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
        </div>
      ))}
    </div>
  ),
};
