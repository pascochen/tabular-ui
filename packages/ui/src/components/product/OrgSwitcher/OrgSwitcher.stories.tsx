import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { orgs as kasaneOrgs } from '../../../fixtures/kasane';
import { OrgSwitcher, type Org } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/OrgSwitcher',
  component: OrgSwitcher,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof OrgSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Kasane's group companies: the Tokyo parent and two of its sales subsidiaries. */
const orgs: Org[] = kasaneOrgs.slice(0, 3).map(({ id, name }) => ({ id, name }));

const [parent, , , uk, shanghai] = kasaneOrgs;
/** Registered names with their local-language form, as the group's legal entity list shows them. */
const longOrgs: Org[] = [
  { id: parent.id, name: `${parent.name} (${parent.localName})` },
  { id: uk.id, name: uk.name },
  { id: shanghai.id, name: `${shanghai.name} (${shanghai.localName})` },
];

/** The switcher in a 240px band — the width of the sidebar it lives in. */
function Stateful({ orgs, initial }: { orgs: Org[]; initial: string }) {
  const [current, setCurrent] = useState(initial);
  return (
    <div className="flex w-60 items-center">
      <OrgSwitcher orgs={orgs} currentOrgId={current} onSwitch={setCurrent} onCreateOrg={() => {}} />
    </div>
  );
}

const handlers = { onSwitch: () => {}, onCreateOrg: () => {} };

/** Pick another workspace to switch. The current one carries the trailing check. */
export const Default: Story = {
  args: { orgs, currentOrgId: orgs[0].id, ...handlers },
  render: () => <Stateful orgs={orgs} initial={orgs[0].id} />,
};

/**
 * Overflow. Names truncate in the trigger and in the menu, and only a name
 * that is actually cut off gets a tooltip — "Kasane UK Ltd" does not.
 */
export const LongNames: Story = {
  args: { orgs: longOrgs, currentOrgId: longOrgs[0].id, ...handlers },
  render: () => <Stateful orgs={longOrgs} initial={longOrgs[0].id} />,
};

/** A single workspace: still a checked row, and still a way to create another. */
export const SingleOrg: Story = {
  args: { orgs: orgs.slice(0, 1), currentOrgId: orgs[0].id, ...handlers },
  render: () => <Stateful orgs={orgs.slice(0, 1)} initial={orgs[0].id} />,
};
