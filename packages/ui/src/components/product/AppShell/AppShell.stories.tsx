import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  BracketsCurlyIcon,
  CaretUpDownIcon,
  ChatsIcon,
  DotsThreeVerticalIcon,
  LightningIcon,
  PulseIcon,
  QuestionIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react';
import type { ColumnDef } from '@tanstack/react-table';

import { Button } from '../../foundational/Button';
import { IconButton } from '../../foundational/IconButton';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../../foundational/Menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../foundational/Tabs';
import avatarAnimatedUrl from '../../foundational/Avatar/fixtures/avatar-animated.svg';
import avatarUrl from '../../foundational/Avatar/fixtures/avatar.svg';
import { AccountMenu } from '../AccountMenu';
import { AgentBlock } from '../AgentBlock';
import { AppBar } from '../AppBar';
import { ChatComposer } from '../ChatComposer';
import { DataTable } from '../DataTable';
import { ContextSwitcherLabel } from '../ContextSwitcher';
import { OrgSwitcher } from '../OrgSwitcher';
import { ProjectSwitcher } from '../ProjectSwitcher';
import { StatusBadge } from '../StatusBadge';
import type { RunStatus } from '../StatusBadge/statuses';
import { money } from '../../../fixtures/format';
import { operatingBridge, orgs as kasaneOrgs, people, projects as kasaneProjects } from '../../../fixtures/kasane';
import { useTheme } from '../../../lib/theme';
import { useAppShell } from './context';
import {
  AppShell,
  AppShellNav,
  AppShellNavGroup,
  AppShellNavItem,
  AppShellPageHeader,
  AppShellPanelBody,
  AppShellPanelFooter,
  AppShellPanelHeader,
  AppShellSidebarToggle,
} from './index';

const meta = {
  title: 'Product/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  // Every story pins a desktop viewport. Unpinned, it would render at
  // whatever width the Storybook pane happens to be — usually below the
  // 1280px floor, which silently shows the collapsed layout instead. 1440 is
  // the width the shell sketch was drawn at.
  globals: { viewport: { value: 'laptopLg', isRotated: false } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------- fixtures */
/*
  Everything below is story content, built from existing components where
  one exists. Breadcrumb and the chat thread are fixtures, not components —
  see README "Not implemented".
*/

const orgs = kasaneOrgs.slice(0, 3).map(({ id, name }) => ({ id, name }));

/** Sidebar header — the organization switcher. */
function SidebarOrgSwitcher() {
  const [current, setCurrent] = useState(orgs[0].id);
  return (
    <OrgSwitcher
      orgs={orgs}
      currentOrgId={current}
      onSwitch={setCurrent}
      // TODO: hook into the create-organization flow — none exists yet.
      onCreateOrg={() => {}}
    />
  );
}

const projects = kasaneProjects.map(({ id, name }) => ({ id, name }));

/** Sidebar body, top — the project switcher under its section label. */
function SidebarProjectSwitcher() {
  const [current, setCurrent] = useState(projects[0].id);
  const [pinned, setPinned] = useState(false);
  return (
    <div className="flex flex-col gap-[var(--gap-bonded)]">
      <ContextSwitcherLabel id="project-label">Project</ContextSwitcherLabel>
      <ProjectSwitcher
        projects={projects}
        currentProjectId={current}
        onSwitch={setCurrent}
        // TODO: open the edit-project flow — none exists yet.
        onEditProject={() => {}}
        pinned={pinned}
        onTogglePin={() => setPinned((p) => !p)}
        // TODO: confirm in a Dialog, then delete — no delete flow exists yet.
        onDeleteProject={() => {}}
        // TODO: hook into the create-project flow — none exists yet.
        onCreateProject={() => {}}
        labelId="project-label"
      />
    </div>
  );
}

function SidebarBody({ active = 'Analysis' }: { active?: string }) {
  const item = (label: string, icon: React.ReactElement) => (
    <AppShellNavItem key={label} href="#" icon={icon} active={label === active}>
      {label}
    </AppShellNavItem>
  );
  return (
    // --gap-nav-group, the same step AppShellNav puts between its groups:
    // the project block is one more section of the sidebar.
    <div className="flex flex-col gap-[var(--gap-nav-group)]">
      <SidebarProjectSwitcher />
      <AppShellNav>
        <AppShellNavGroup label="Business">
          {item('Analysis', <PulseIcon />)}
          {item('Questions', <QuestionIcon />)}
          {item('Dataset', <TreeStructureIcon />)}
          {item('Specs', <BracketsCurlyIcon />)}
        </AppShellNavGroup>
      </AppShellNav>
    </div>
  );
}

const mei = {
  name: people.fpa.name,
  shortName: people.fpa.shortName,
  email: people.fpa.email,
  avatarSrc: avatarUrl,
  avatarAnimatedSrc: avatarAnimatedUrl,
  initials: people.fpa.initials,
};

/**
 * Sidebar footer — the account row. The Theme group goes through `useTheme`,
 * as an app's would; it starts from the toolbar's mode and isn't remembered.
 */
function AccountFooter() {
  const [initial] = useState<'dark' | 'light'>(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  );
  const { preference, setPreference } = useTheme({ defaultPreference: initial, storageKey: null });
  return (
    <AccountMenu
      user={mei}
      theme={preference}
      onThemeChange={setPreference}
      // TODO: route to the profile page — none exists yet.
      onOpenProfile={() => {}}
      // TODO: route to the workspace settings page — none exists yet.
      onOpenWorkspaceSettings={() => {}}
      // TODO: route to subscription and billing — none exists yet.
      onOpenBilling={() => {}}
      // TODO: open the marketing homepage — no URL is configured yet.
      onOpenHomepage={() => {}}
      // TODO: hook into sign-out — no auth flow exists yet.
      onSignOut={() => {}}
    />
  );
}

/**
 * Breadcrumb fixture. With the sidebar pinned, company and project are
 * already on screen, so the trail is the page alone. Collapsed, the trail
 * takes them over. This is what `useAppShell()` is for.
 */
function Breadcrumb() {
  const { sidebarOpen } = useAppShell();
  const ancestors = sidebarOpen ? [] : [orgs[0].name, projects[0].name];
  return (
    <nav aria-label="Breadcrumb">
      <ol role="list" className="flex items-center gap-[var(--gap-inline)] text-base">
        {ancestors.map((crumb) => (
          <li key={crumb} className="flex items-center gap-[var(--gap-inline)]">
            <a href="#" className="text-text-secondary hover:text-text-body">
              {crumb}
            </a>
            <span aria-hidden="true" className="text-text-tertiary">
              /
            </span>
          </li>
        ))}
        <li>
          <Menu>
            <MenuTrigger
              render={<Button variant="ghost" aria-current="page" className="px-[var(--pad-sidebar-item)]" />}
            >
              Analysis
              <CaretUpDownIcon />
            </MenuTrigger>
            <MenuContent align="start">
              <MenuItem>Analysis</MenuItem>
              <MenuItem>Questions</MenuItem>
              <MenuItem>Dataset</MenuItem>
              <MenuItem>Specs</MenuItem>
            </MenuContent>
          </Menu>
        </li>
      </ol>
    </nav>
  );
}

/** Opens and closes the chat panel. A disclosure: aria-expanded + aria-controls. */
function ChatToggle() {
  const { panelOpen, togglePanel, panelId } = useAppShell();
  return (
    <Button variant="outline" aria-expanded={panelOpen} aria-controls={panelId} onClick={togglePanel}>
      <ChatsIcon />
      Chat
    </Button>
  );
}

function TopNav() {
  return (
    <AppBar
      brand={
        <span className="flex items-center gap-[var(--gap-inline)]">
          <AppShellSidebarToggle />
          <Breadcrumb />
        </span>
      }
      actions={
        <>
          <ChatToggle />
          <Button>
            <LightningIcon />
            Generate spec
          </Button>
        </>
      }
    />
  );
}

/**
 * Exact yen, rounded once by `money()` when shown. Rounding the parts before
 * adding them gives a total that doesn't foot: the two exchange-rate steps
 * round to ¥41m and ¥275m, but they sum to ¥316,748,831, which is ¥317m.
 */
const step = (id: string) => operatingBridge.steps.find((s) => s.id === id)?.value ?? 0;
const shortfall = operatingBridge.budget - operatingBridge.actual;
const fxTotal = step('fx-subsidiaries') + step('fx-intercompany');

const summary = `H1 operating profit closed at ${money(operatingBridge.actual)}, ${money(shortfall)} under budget. Exchange rates explain ${money(-fxTotal)} of the gap: transfer prices are fixed at budget rates, so a stronger yen moved margin out of Japan. A bad-debt reserve in the US and an empty floor in the head office took the rest, offset by the hiring freeze.`;
const scope = `This analysis covers the five group companies from April to September, consolidated in yen. It compares actuals with the budget approved in March and with the first half of last year, and traces every figure to its journal entries. October is still open and is excluded.`;

/**
 * The page's title band, in `AppShell`'s `pageHeader` slot. Its rule lines up
 * with the chat header's. The overflow action shows the `actions` slot.
 */
function AnalysisHeader({ title = 'Analysis' }: { title?: string }) {
  return (
    <AppShellPageHeader
      title={title}
      actions={
        <IconButton aria-label="Page actions">
          <DotsThreeVerticalIcon />
        </IconButton>
      }
    />
  );
}

/** The page body in the sketch: tabs over a summary and a scope section. */
function AnalysisPage() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
        <TabsTrigger value="documents">Uploaded documents</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        {/*
          Prose sets its own measure. The shell's --w-content column (§7.9)
          caps the page on a wide monitor, not the line length.
          56ch, not 72: a `ch` is the width of "0" (6.46px in Source Sans 3
          at 13px) and the average character in this prose is ~5.3px, so
          72ch runs ~89 characters a line. 56ch lands near 69.
        */}
        <div className="flex max-w-[56ch] flex-col gap-[var(--gap-section)] pt-[var(--gap-section)]">
          <section className="flex flex-col gap-[var(--gap-bonded)]">
            <div className="flex items-center justify-between gap-[var(--gap-inline)]">
              <h2 className="text-md font-semibold text-text-primary">Summary</h2>
              <IconButton aria-label="Summary actions" size="sm">
                <DotsThreeVerticalIcon />
              </IconButton>
            </div>
            <p className="text-base text-text-body">{summary}</p>
          </section>
          <section className="flex flex-col gap-[var(--gap-bonded)]">
            <h2 className="text-md font-semibold text-text-primary">Scope</h2>
            <p className="text-base text-text-body">{scope}</p>
          </section>
        </div>
      </TabsContent>
      <TabsContent value="collaborators" />
      <TabsContent value="documents" />
    </Tabs>
  );
}

/**
 * Chat panel fixture. The agent's reply is `AgentBlock` — agent-authored
 * content is never a generic bubble (CLAUDE.md). The composer is
 * `ChatComposer`.
 */
function ChatPanel() {
  return (
    <>
      <AppShellPanelHeader title="Chat" />
      <AppShellPanelBody className="flex flex-col gap-[var(--gap-group)]">
        <div className="ml-auto max-w-[85%] rounded-md bg-canvas p-[var(--pad-card)] text-base text-text-body">
          Why is H1 operating profit under budget?
        </div>
        <AgentBlock authorship="AI" meta="just now">
          Exchange rates explain {money(-fxTotal)} of the {money(shortfall)}. {money(-step('fx-intercompany'))} is
          Japan&rsquo;s margin on sales to the subsidiaries, priced at budget rates, and{' '}
          {money(-step('fx-subsidiaries'))} is their profit worth fewer yen.
        </AgentBlock>
      </AppShellPanelBody>
      <AppShellPanelFooter>
        <ChatComposer onSend={() => {}} />
      </AppShellPanelFooter>
    </>
  );
}

type RunRow = { model: string; status: RunStatus; rows: number; duration: string };

const models = ['fct_gl_entries', 'dim_accounts', 'stg_sap__bkpf', 'stg_sap__bseg', 'fct_ap_aging', 'dim_cost_centers'];
const statuses: RunStatus[] = ['passed', 'passed', 'running', 'failed', 'stale', 'needs-review'];

// 2,000 rows: past the virtualization threshold, so the story proves the
// shell bounds <main>. An unbounded parent renders every row with no error.
const runRows: RunRow[] = Array.from({ length: 2000 }, (_, i) => ({
  model: `${models[i % models.length]}_${String(i).padStart(4, '0')}`,
  status: statuses[i % statuses.length],
  rows: (i * 7919) % 1_300_000,
  duration: `${i % 4}m ${String((i * 13) % 60).padStart(2, '0')}s`,
}));

const runColumns: ColumnDef<RunRow, unknown>[] = [
  { accessorKey: 'model', header: 'Model', meta: { content: 'mono' } },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    accessorKey: 'rows',
    header: 'Rows',
    meta: { align: 'numeric' },
    cell: ({ row }) => row.original.rows.toLocaleString('en-US'),
  },
  { accessorKey: 'duration', header: 'Duration', meta: { align: 'numeric' } },
];

function RunsTable() {
  return (
    <div className="min-h-0 flex-1">
      <DataTable columns={runColumns} data={runRows} />
    </div>
  );
}

/* ---------------------------------------------------------------- stories */

/**
 * The expanded sketch: sidebar docked with its own header, top nav over main
 * and chat, chat open. Three header bands, one rule.
 */
export const Expanded: Story = {
  args: {
    topNav: <TopNav />,
    sidebarHeader: <SidebarOrgSwitcher />,
    sidebar: <SidebarBody />,
    sidebarFooter: <AccountFooter />,
    panel: <ChatPanel />,
    panelLabel: 'Chat',
    pageHeader: <AnalysisHeader />,
    children: <AnalysisPage />,
  },
};

/**
 * The collapsed sketch. No rail — the sidebar is gone, the toggle moves to
 * the top nav's leading edge, and the breadcrumb takes over company and
 * project. Hover the toggle to peek the sidebar as an overlay; click it, or
 * the peek's own toggle, to pin it.
 */
export const Collapsed: Story = {
  args: { ...Expanded.args, defaultSidebarOpen: false },
};

/** Chat closed: main takes the width back. The Chat button reopens it. */
export const ChatClosed: Story = {
  args: { ...Expanded.args, defaultPanelOpen: false },
};

/**
 * At the 1280px floor, both sides open: main keeps 600px. This is the
 * tightest the docked layout gets.
 */
export const AtFloor: Story = {
  args: Expanded.args,
  globals: { viewport: { value: 'laptop', isRotated: false } },
};

/**
 * Below the floor — a small laptop or a half-screen window. The sidebar
 * starts collapsed; hover the toggle to peek, click to pin. Pinned here, it
 * docks and pushes main like anywhere else.
 */
export const BelowFloor: Story = {
  args: Expanded.args,
  globals: { viewport: { value: 'split', isRotated: false } },
};

/**
 * The dense case: a 2,000-row virtualized table in main, beside the chat. A
 * table page, so `contentWidth="full"`: no --w-content cap (§7.9).
 */
export const WithTable: Story = {
  args: {
    ...Expanded.args,
    contentWidth: 'full',
    pageHeader: <AppShellPageHeader title="Runs" />,
    children: <RunsTable />,
  },
};

/**
 * A wide monitor, table page. Extra width is extra columns, so
 * `contentWidth="full"`: the frame tier's 48px gutter applies (§7.3) and the
 * --w-content cap does not (§7.9). Compare `CentredColumn`, the default.
 */
export const Wide: Story = {
  args: {
    ...Expanded.args,
    contentWidth: 'full',
    pageHeader: <AppShellPageHeader title="Runs" />,
    children: <RunsTable />,
  },
  globals: { viewport: { value: 'wide', isRotated: false } },
};

/**
 * Wide 2560, both sides open: main is 1880px, wider than --w-content, so the
 * page header and body centre one 1280px column (1184px of content) with
 * blank margins either side (§7.9). This is `contentWidth="contained"`, the
 * default for anything that is not a table page. The 1280px floor
 * (`AtFloor`) is unchanged.
 */
export const CentredColumn: Story = {
  args: Expanded.args,
  globals: { viewport: { value: 'wide', isRotated: false } },
};

/** No sidebar slots: neither toggle renders, and the top nav starts at the edge. */
export const NoSidebar: Story = {
  args: {
    topNav: <TopNav />,
    panel: <ChatPanel />,
    panelLabel: 'Chat',
    pageHeader: <AnalysisHeader />,
    children: <AnalysisPage />,
  },
};

/**
 * A page title too long for main at the 1280px floor, both sides open. It
 * truncates with an ellipsis and the actions keep their place. The full title
 * stays in the DOM, so assistive technology reads it whole.
 */
export const LongPageTitle: Story = {
  args: {
    ...Expanded.args,
    pageHeader: (
      <AnalysisHeader title="Operating profit variance by entity, account and product line — H1 FY2026 against budget and prior year" />
    ),
  },
  globals: { viewport: { value: 'laptop', isRotated: false } },
};

/**
 * The regions as placeholders. Dashed borders mean placeholder in this
 * system (§7.8) — the frame without content.
 */
export const Regions: Story = {
  args: Expanded.args,
  render: () => {
    const slot = (label: string) => (
      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border-strong p-2 text-sm text-text-secondary">
        {label}
      </div>
    );
    return (
      <AppShell
        topNav={<TopNav />}
        sidebarHeader={slot('sidebarHeader')}
        sidebar={<div className="flex h-full flex-col">{slot('sidebar')}</div>}
        sidebarFooter={slot('sidebarFooter')}
        panel={
          <>
            <AppShellPanelHeader title="panel" />
            <AppShellPanelBody className="flex flex-col">{slot('AppShellPanelBody')}</AppShellPanelBody>
            <AppShellPanelFooter>{slot('AppShellPanelFooter')}</AppShellPanelFooter>
          </>
        }
        panelLabel="Panel"
        pageHeader={<AppShellPageHeader title="pageHeader" />}
      >
        {slot('main — the only region that scrolls the page')}
      </AppShell>
    );
  },
};
