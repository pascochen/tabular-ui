import type { Meta, StoryObj } from '@storybook/react-vite';
import { BellIcon, CaretDownIcon, MagnifyingGlassIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '../../foundational/Button';
import { IconButton } from '../../foundational/IconButton';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../foundational/Menu';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import type { RunStatus } from '../StatusBadge/statuses';
import { AppBar, AppBarNav, AppBarNavItem } from './index';

const meta = {
  title: 'Product/AppBar',
  component: AppBar,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Placeholder mark. Real branding is a slot — AppBar owns none of it. */
function BrandMark({ label = 'Tabular UI' }: { label?: string }) {
  return (
    <span className="flex items-center gap-[var(--gap-control-icon)]">
      <span aria-hidden="true" className="size-[var(--size-icon-md)] rounded-xs bg-border-strong" />
      <span className="text-md font-semibold text-text-primary">{label}</span>
    </span>
  );
}

const sections = ['Dashboard', 'Pipelines', 'Models', 'Reconciliation', 'Settings'];

function AccountMenu() {
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton aria-label="Account" tooltip={false}>
            <UserIcon />
          </IconButton>
        }
      />
      <MenuContent align="end">
        <MenuItem>Profile</MenuItem>
        <MenuItem>Preferences</MenuItem>
        <MenuSeparator />
        <MenuItem>
          <SignOutIcon />
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * The reference layout: brand on the leading edge, nav pushed against the
 * trailing actions.
 */
export const Default: Story = {
  args: {
    brand: <BrandMark />,
    actions: (
      <>
        <IconButton aria-label="Search">
          <MagnifyingGlassIcon />
        </IconButton>
        <IconButton aria-label="Notifications">
          <BellIcon />
        </IconButton>
        <AccountMenu />
      </>
    ),
    children: (
      <AppBarNav align="end">
        {sections.map((section, i) => (
          <AppBarNavItem key={section} href="#" active={i === 0}>
            {section}
          </AppBarNavItem>
        ))}
      </AppBarNav>
    ),
  },
};

/** Items against the brand instead of the actions. */
export const NavAlignedStart: Story = {
  args: {
    ...Default.args,
    children: (
      <AppBarNav align="start">
        {sections.map((section, i) => (
          <AppBarNavItem key={section} href="#" active={i === 1}>
            {section}
          </AppBarNavItem>
        ))}
      </AppBarNav>
    ),
  },
};

/**
 * A nav item that opens a dropdown. This is the caret pattern from shadcn's
 * NavigationMenu, built from the `Menu` we already have — which is why the
 * system needs no fifteenth foundational component to ship a navbar.
 */
export const WithDropdown: Story = {
  args: {
    brand: <BrandMark />,
    actions: <AccountMenu />,
    children: (
      <AppBarNav align="start">
        <AppBarNavItem href="#" active>
          Dashboard
        </AppBarNavItem>
        <li className="shrink-0">
          <Menu>
            <MenuTrigger render={<Button variant="ghost" className="text-text-secondary hover:text-text-body" />}>
              Pipelines
              <CaretDownIcon />
            </MenuTrigger>
            <MenuContent align="start">
              <MenuItem>All runs</MenuItem>
              <MenuItem>Schedules</MenuItem>
              <MenuItem>Sources</MenuItem>
            </MenuContent>
          </Menu>
        </li>
        <AppBarNavItem href="#">Models</AppBarNavItem>
        <AppBarNavItem href="#">Settings</AppBarNavItem>
      </AppBarNav>
    ),
  },
};

/** The minimum viable bar. Every slot except `brand` is optional. */
export const BrandOnly: Story = {
  args: { brand: <BrandMark /> },
};

/**
 * Twelve items with long labels at the 1280px floor. Responsive collapse is
 * deliberately not implemented yet — this story makes the current behaviour
 * visible rather than letting it be discovered in production.
 * `overflow-x-auto` is not the fix: it would clip the items' focus rings,
 * which is the failure §4 exists to prevent. Past a handful of sections, the
 * answer is `AppShell`'s sidebar, not a wider bar.
 */
export const Overflow: Story = {
  globals: { viewport: { value: 'laptop', isRotated: false } },
  args: {
    brand: <BrandMark />,
    actions: <AccountMenu />,
    children: (
      <AppBarNav align="start">
        {[
          'Dashboard',
          'Pipeline runs',
          'dbt models',
          'Reconciliation',
          'Source systems',
          'Data quality',
          'Lineage',
          'Agent activity',
          'Scheduled jobs',
          'Access control',
          'Audit log',
          'Settings',
        ].map((section, i) => (
          <AppBarNavItem key={section} href="#" active={i === 0}>
            {section}
          </AppBarNavItem>
        ))}
      </AppBarNav>
    ),
  },
};

type ModelRow = {
  model: string;
  status: RunStatus;
  rows: number;
  duration: string;
};

const modelRows: ModelRow[] = [
  { model: 'fct_gl_entries', status: 'passed', rows: 1_284_902, duration: '2m 14s' },
  { model: 'dim_accounts', status: 'passed', rows: 4_812, duration: '0m 09s' },
  { model: 'stg_sap__bkpf', status: 'running', rows: 962_411, duration: '1m 02s' },
  { model: 'stg_sap__bseg', status: 'failed', rows: 0, duration: '0m 41s' },
  { model: 'fct_ap_aging', status: 'stale', rows: 88_140, duration: '0m 27s' },
  { model: 'dim_cost_centers', status: 'needs-review', rows: 1_204, duration: '0m 06s' },
];

const modelColumns: ColumnDef<ModelRow, unknown>[] = [
  { accessorKey: 'model', header: 'Model', meta: { content: 'mono' } },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'rows',
    header: 'Rows',
    meta: { align: 'numeric' },
    cell: ({ row }) => row.original.rows.toLocaleString('en-US'),
  },
  { accessorKey: 'duration', header: 'Duration', meta: { align: 'numeric' } },
];

/**
 * The dense case. The bar above the densest surface in the system, with the
 * table in a bounded-height container — an unbounded parent makes the
 * virtualizer render every row.
 */
export const InDashboard: Story = {
  args: Default.args,
  render: (args) => (
    // A stand-in viewport, not a component height, so it is an inline style.
    <div className="flex flex-col bg-canvas" style={{ height: 520 }}>
      <AppBar {...args} />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--gap-section)] p-[var(--pad-page-x)]">
        <h1 className="text-lg font-semibold tracking-[var(--tracking-tight)] text-text-primary">Pipeline runs</h1>
        <div className="min-h-0 flex-1">
          <DataTable columns={modelColumns} data={modelRows} />
        </div>
      </div>
    </div>
  ),
};
