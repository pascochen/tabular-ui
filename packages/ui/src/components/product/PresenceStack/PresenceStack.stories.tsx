import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Avatar, AvatarFallback } from '../../foundational/Avatar';
import { people } from '../../../fixtures/kasane';
import { PresenceStack, type PresenceMember } from './index';

const member = (p: { id: string; name: string; initials: string }): PresenceMember => ({
  id: p.id,
  name: p.name,
  avatar: (
    <Avatar>
      <AvatarFallback>{p.initials}</AvatarFallback>
    </Avatar>
  ),
});

const team = [people.controller, people.payables, people.generalLedger, people.fpaAnalyst, people.usCredit].map(member);

const meta = {
  title: 'Product/PresenceStack',
  component: PresenceStack,
  parameters: { layout: 'padded' },
  args: { members: team.slice(0, 3) },
} satisfies Meta<typeof PresenceStack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three people here: every face drawn, each overlapping the last by 4px. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list', { name: 'Here now' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    // Names are read, avatars are not: no initials in the accessible text.
    await expect(list).toHaveTextContent(people.controller.name);
    await expect(canvasElement.querySelector('[data-slot="avatar"]')).toHaveAttribute('aria-hidden', 'true');
  },
};

/**
 * Five here, three drawn: the rest fold into "+2". The count is only seen;
 * every member is still an item with a name, so the list reads as five.
 */
export const Overflow: Story = {
  args: { members: team },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list', { name: 'Here now' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    await expect(list).toHaveTextContent(people.usCredit.name);
    await expect(within(canvasElement).getByText('+2')).toBeVisible();
    // Each avatar overlaps the one before by 4px, and the gap is the ground's colour.
    const avatars = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="avatar"]')];
    const [a, b] = avatars.map((el) => el.getBoundingClientRect());
    await expect(Math.round(a.right - b.left)).toBe(4);
    const ring = getComputedStyle(avatars[1]);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(ring.outlineWidth).toBe('2px');
    // The canvas, read the same way, from a probe on the same page.
    const probe = document.createElement('div');
    probe.className = 'bg-canvas';
    canvasElement.append(probe);
    const canvas = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(ring.outlineColor).toBe(canvas);
  },
};

/**
 * On a surface: a panel header or a card. `ground="surface"` takes the gap's
 * colour from the surface, or the cut-out would show the canvas through it.
 */
export const OnSurface: Story = {
  args: { members: team, ground: 'surface' },
  decorators: [
    (Story) => (
      <div className="w-fit bg-surface p-[var(--pad-card)]">
        <Story />
      </div>
    ),
  ],
};

/** One person: no overlap, no count. */
export const One: Story = {
  args: { members: team.slice(0, 1), label: 'In this channel' },
};
