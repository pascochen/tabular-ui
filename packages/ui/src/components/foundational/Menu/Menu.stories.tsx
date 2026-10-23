import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import { ArrowClockwiseIcon, DotsThreeIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Foundational/Menu',
  component: Menu,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline">Actions</Button>} />
      <MenuContent>
        <MenuItem>
          Re-run<MenuShortcut>⌘R</MenuShortcut>
        </MenuItem>
        <MenuItem>
          Edit model<MenuShortcut>⌘E</MenuShortcut>
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="danger">Delete model</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Icons, shortcuts, groups and a danger item. */
export const Rich: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline">Model actions</Button>} />
      <MenuContent>
        <MenuGroup>
          <MenuLabel>Run</MenuLabel>
          <MenuItem>
            <ArrowClockwiseIcon aria-hidden="true" />
            Re-run<MenuShortcut>⌘R</MenuShortcut>
          </MenuItem>
          <MenuItem>
            <PencilSimpleIcon aria-hidden="true" />
            Edit<MenuShortcut>⌘E</MenuShortcut>
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem variant="danger">
          <TrashIcon aria-hidden="true" />
          Delete<MenuShortcut>⌫</MenuShortcut>
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/** Submenus. */
export const Submenu: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline">Export</Button>} />
      <MenuContent>
        <MenuItem>Copy model name</MenuItem>
        <MenuSub>
          <MenuSubTrigger>Download as</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>CSV</MenuItem>
            <MenuItem>Parquet</MenuItem>
            <MenuItem>JSON</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuItem>Open in warehouse</MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/**
 * Checkbox and radio items. These are menu affordances, not form controls —
 * `CLAUDE.md`'s "there is no Radio" is about standalone radio groups, where a
 * Select is denser.
 */
export const Selectable: Story = {
  render: function SelectableStory() {
    const [cols, setCols] = useState({ rows: true, duration: true, owner: false });
    const [sort, setSort] = useState('name');
    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline">View</Button>} />
        <MenuContent>
          <MenuLabel>Columns</MenuLabel>
          <MenuCheckboxItem checked={cols.rows} onCheckedChange={(v) => setCols((c) => ({ ...c, rows: v }))}>
            Row count
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={cols.duration} onCheckedChange={(v) => setCols((c) => ({ ...c, duration: v }))}>
            Duration
          </MenuCheckboxItem>
          <MenuCheckboxItem checked={cols.owner} onCheckedChange={(v) => setCols((c) => ({ ...c, owner: v }))}>
            Owner
          </MenuCheckboxItem>
          <MenuSeparator />
          <MenuLabel>Sort by</MenuLabel>
          <MenuRadioGroup value={sort} onValueChange={(v) => setSort(v as string)}>
            <MenuRadioItem value="name">Name</MenuRadioItem>
            <MenuRadioItem value="status">Status</MenuRadioItem>
            <MenuRadioItem value="duration">Duration</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    );
  },
};

/**
 * `indicator="switch"`: a setting that applies the moment it flips. The menu
 * stays open so the flip is seen. Announced as a checkable menu item.
 */
export const SwitchItem: Story = {
  render: function SwitchItemStory() {
    const [compact, setCompact] = useState(true);
    const [wrap, setWrap] = useState(false);
    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline">Display</Button>} />
        <MenuContent>
          <MenuCheckboxItem indicator="switch" checked={compact} onCheckedChange={setCompact}>
            Compact rows
          </MenuCheckboxItem>
          <MenuCheckboxItem indicator="switch" checked={wrap} onCheckedChange={setWrap}>
            Wrap long values
          </MenuCheckboxItem>
        </MenuContent>
      </Menu>
    );
  },
};

/** The dense case: a row overflow menu on an IconButton. */
export const RowOverflow: Story = {
  render: () => (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        maxWidth: 380,
      }}
    >
      {['fct_gl_entries', 'dim_accounts'].map((m, i) => (
        <div
          key={m}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--pad-cell-x)',
            height: 'var(--h-row-sm)',
            padding: '0 var(--pad-cell-x)',
            borderTop: i === 0 ? undefined : '1px solid var(--color-border)',
          }}
        >
          <span
            className="font-mono text-text-body"
            style={{
              flex: 1,
              fontSize: 'var(--text-xs)',
            }}
          >
            {m}
          </span>
          <Menu>
            <MenuTrigger
              render={
                <IconButton size="sm" aria-label={`Actions for ${m}`} tooltip={false}>
                  <DotsThreeIcon />
                </IconButton>
              }
            />
            <MenuContent align="end">
              <MenuItem>Re-run</MenuItem>
              <MenuItem>View lineage</MenuItem>
              <MenuSeparator />
              <MenuItem variant="danger">Delete</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      ))}
    </div>
  ),
};

/**
 * `density="spaced"`: a menu picked from the shell, not scanned over a table —
 * 36px rows 4px apart, a 28px label and a softer separator. No shadow, as
 * every popup (§4). Set once on `MenuContent`; every part inside follows, submenus too.
 */
export const Spaced: Story = {
  render: function SpacedStory() {
    const [sort, setSort] = useState('name');
    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline">Spaced</Button>} />
        <MenuContent density="spaced">
          <MenuGroup>
            <MenuLabel>Model</MenuLabel>
            <MenuItem>
              <ArrowClockwiseIcon weight="bold" aria-hidden="true" />
              Re-run
            </MenuItem>
            <MenuItem>
              <PencilSimpleIcon weight="bold" aria-hidden="true" />
              Edit model
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuRadioGroup value={sort} onValueChange={(v) => setSort(v as string)}>
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioItem value="name">Name</MenuRadioItem>
            <MenuRadioItem value="status">Status</MenuRadioItem>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuSub>
            <MenuSubTrigger>More</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>View lineage</MenuItem>
              <MenuItem variant="danger">
                <TrashIcon weight="bold" aria-hidden="true" />
                Delete
              </MenuItem>
            </MenuSubContent>
          </MenuSub>
        </MenuContent>
      </Menu>
    );
  },
};

/**
 * Test only, hidden from the sidebar and docs so nobody copies it:
 * `destructive` is the deprecated spelling of `danger` (renamed 2026-10-10),
 * still honoured. It must render exactly as `danger` does, and
 * `data-variant` reports `danger`.
 */
export const DeprecatedDestructiveSpelling: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <Menu defaultOpen>
      <MenuTrigger render={<Button variant="outline">Actions</Button>} />
      <MenuContent>
        {/* eslint-disable-next-line no-restricted-syntax -- exercising the deprecated spelling on purpose */}
        <MenuItem variant="destructive">Legacy</MenuItem>
        <MenuItem variant="danger">Current</MenuItem>
      </MenuContent>
    </Menu>
  ),
  play: async () => {
    // The popup renders in a portal, outside the canvas.
    const body = within(document.body);
    const legacy = await body.findByRole('menuitem', { name: 'Legacy' });
    await expect(legacy).toHaveAttribute('data-variant', 'danger');
    await expect(legacy.className).toBe(body.getByRole('menuitem', { name: 'Current' }).className);
  },
};
