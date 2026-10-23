import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArchiveIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { ContextSwitcher, ContextSwitcherLabel, type ContextItem, type ContextSwitcherProps } from './index';

/**
 * The shared switcher. Product code reaches for `OrgSwitcher` or
 * `ProjectSwitcher`; these stories show the two triggers and the action
 * contract they are built from. Mode is driven by the toolbar Theme control.
 */
const meta = {
  title: 'Product/ContextSwitcher',
  component: ContextSwitcher,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ContextSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

const workspaces: ContextItem[] = [
  { id: 'ws_finance', name: 'Finance' },
  { id: 'ws_ops', name: 'Operations' },
  { id: 'ws_tax', name: 'Tax' },
];

function Stateful(props: Omit<ContextSwitcherProps, 'currentId' | 'onSwitch'>) {
  const [current, setCurrent] = useState(props.items[0].id);
  return <ContextSwitcher {...props} currentId={current} onSwitch={setCurrent} />;
}

const base = {
  items: workspaces,
  label: 'Workspaces',
  actions: [
    { type: 'item', label: 'Archive workspace', icon: <ArchiveIcon />, onSelect: () => {} },
    { type: 'copy-id', label: 'Copy workspace ID', announcement: 'Workspace ID copied' },
  ],
  createLabel: 'Create workspace',
  onCreate: () => {},
} satisfies Omit<ContextSwitcherProps, 'currentId' | 'onSwitch'>;

/**
 * Both triggers in a 240px band. `compact` sizes to its name with the caret
 * beside it, for a header shared with other controls; `block` fills the band
 * with the caret at the far edge, under a `ContextSwitcherLabel`.
 */
export const Triggers: Story = {
  args: { ...base, currentId: workspaces[0].id, onSwitch: () => {} },
  render: () => (
    <div className="flex w-60 flex-col gap-[var(--gap-nav-group)] border border-border bg-surface px-[var(--pad-page-x)] py-2">
      <div className="flex items-center">
        <Stateful {...base} trigger="compact" />
      </div>
      <div className="flex flex-col gap-[var(--gap-bonded)]">
        <ContextSwitcherLabel id="workspace-label">Workspace</ContextSwitcherLabel>
        <Stateful {...base} trigger="block" labelId="workspace-label" />
      </div>
    </div>
  ),
};
