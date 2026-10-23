import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { longProjects as kasaneLongProjects, projects as kasaneProjects } from '../../../fixtures/kasane';
import { ContextSwitcherLabel } from '../ContextSwitcher';
import { ProjectSwitcher, type Project } from './index';

/** Mode is driven by the toolbar Theme control. Dark is canonical. */
const meta = {
  title: 'Product/ProjectSwitcher',
  component: ProjectSwitcher,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProjectSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Kasane's finance workspace: the half-year close, the forecast and two smaller pieces of work. */
const projects: Project[] = kasaneProjects.map(({ id, name }) => ({ id, name }));
const longProjects: Project[] = kasaneLongProjects.map(({ id, name }) => ({ id, name }));

/**
 * In a 240px band on the sidebar's ground, with the section label above —
 * the way it sits in `AppShell`. The gutter is the sidebar body's
 * `--pad-page-x`, so the label and trigger text line up as they will there.
 */
function Sidebar({ projects, initialPinned = false }: { projects: Project[]; initialPinned?: boolean }) {
  const [current, setCurrent] = useState(projects[0].id);
  const [pinned, setPinned] = useState(initialPinned);
  return (
    <div className="flex w-60 flex-col gap-[var(--gap-bonded)] border border-border bg-surface px-[var(--pad-page-x)] py-2">
      <ContextSwitcherLabel id="project-label">Project</ContextSwitcherLabel>
      <ProjectSwitcher
        projects={projects}
        currentProjectId={current}
        onSwitch={setCurrent}
        onEditProject={() => {}}
        pinned={pinned}
        onTogglePin={() => setPinned((p) => !p)}
        onDeleteProject={() => {}}
        onCreateProject={() => {}}
        labelId="project-label"
      />
    </div>
  );
}

const handlers = {
  onSwitch: () => {},
  onEditProject: () => {},
  onTogglePin: () => {},
  onDeleteProject: () => {},
  onCreateProject: () => {},
};

/**
 * Plain text at rest; hover for the fill, which stays while the menu is open.
 * Hover or arrow Right on the current project for its actions.
 */
export const Default: Story = {
  args: { projects, currentProjectId: projects[0].id, ...handlers },
  render: () => <Sidebar projects={projects} />,
};

/** The current project is pinned, so its action reads "Unpin project". */
export const Pinned: Story = {
  args: { projects, currentProjectId: projects[0].id, pinned: true, ...handlers },
  render: () => <Sidebar projects={projects} initialPinned />,
};

/**
 * Overflow. The name truncates before the caret, which stays at the far edge,
 * and only a name that is actually cut off gets a tooltip.
 */
export const LongNames: Story = {
  args: { projects: longProjects, currentProjectId: longProjects[0].id, ...handlers },
  render: () => <Sidebar projects={longProjects} />,
};
