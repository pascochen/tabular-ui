import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Input } from '../Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Details</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>fct_gl_entries</PopoverTitle>
          <PopoverDescription>Last run 4 minutes ago · 1,284,102 rows</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * A popover holds real, focusable content — which is the reason to reach for
 * it over a Tooltip whenever the content matters. Base UI's tooltip is visual
 * only and its text is never announced.
 */
export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Add filter</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Add filter</PopoverTitle>
        </PopoverHeader>
        <Select defaultValue="status">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
        <Input size="sm" placeholder="Value…" />
        <div style={{ display: 'flex', gap: 'var(--gap-inline)', justifyContent: 'flex-end' }}>
          <PopoverClose
            render={
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            }
          />
          <PopoverClose render={<Button size="sm">Apply</Button>} />
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/** Four sides. */
export const Sides: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 'var(--gap-group)' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                {side}
              </Button>
            }
          />
          <PopoverContent side={side} className="w-48">
            <PopoverDescription>Opens on {side}</PopoverDescription>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};
