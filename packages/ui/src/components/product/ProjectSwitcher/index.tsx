import { PencilSimpleIcon, PushPinIcon, PushPinSlashIcon, TrashIcon } from '@phosphor-icons/react';

import { ContextSwitcher, type ContextItem } from '../ContextSwitcher';

export type Project = ContextItem;

export type ProjectSwitcherProps = {
  /** Every project in the current organization, in display order. */
  projects: Project[];
  currentProjectId: string;
  /** Called with the chosen project's id. Not called for the current project — it opens the submenu instead. */
  onSwitch: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  /** Whether the current project is pinned. Flips the action to "Unpin project". */
  pinned?: boolean;
  /** Pins or unpins the current project — read `pinned` for which. */
  onTogglePin: (projectId: string) => void;
  /**
   * Called on "Delete project". **Confirm before deleting** — this is the
   * caller's `Dialog`, not the menu's: a menu row is one click from an
   * irreversible action, and the menu has already closed.
   */
  onDeleteProject: (projectId: string) => void;
  /** Starts the create-project flow. */
  onCreateProject: () => void;
  /** The `id` of the `ContextSwitcherLabel` above it. */
  labelId?: string;
  className?: string;
};

/**
 * ProjectSwitcher — product. `ContextSwitcher` with the project wording and
 * the `block` trigger: full width under a `ContextSwitcherLabel`, plain text
 * until hovered, caret at the far edge.
 *
 * Behaviour, alignment, truncation and the copy confirmation all live in
 * `ContextSwitcher`; see its README.
 */
function ProjectSwitcher({
  projects,
  currentProjectId,
  onSwitch,
  onEditProject,
  pinned = false,
  onTogglePin,
  onDeleteProject,
  onCreateProject,
  labelId,
  className,
}: ProjectSwitcherProps) {
  return (
    <ContextSwitcher
      items={projects}
      currentId={currentProjectId}
      onSwitch={onSwitch}
      label="Projects"
      actions={[
        { type: 'item', label: 'Edit project', icon: <PencilSimpleIcon />, onSelect: onEditProject },
        pinned
          ? { type: 'item', label: 'Unpin project', icon: <PushPinSlashIcon />, onSelect: onTogglePin }
          : { type: 'item', label: 'Pin project', icon: <PushPinIcon />, onSelect: onTogglePin },
        { type: 'copy-id', label: 'Copy project ID', announcement: 'Project ID copied' },
        {
          type: 'item',
          label: 'Delete project',
          icon: <TrashIcon />,
          onSelect: onDeleteProject,
          variant: 'danger',
        },
      ]}
      createLabel="Create project"
      onCreate={onCreateProject}
      trigger="block"
      labelId={labelId}
      className={className}
    />
  );
}

export { ProjectSwitcher };
