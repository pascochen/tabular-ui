# ProjectSwitcher

Product. `ContextSwitcher` with the project wording and the `block` trigger. Goes at the top of `AppShell`'s sidebar body, under a `ContextSwitcherLabel`.

```tsx
<ContextSwitcherLabel id="project-label">Project</ContextSwitcherLabel>
<ProjectSwitcher
  projects={projects}
  currentProjectId={projectId}
  onSwitch={setProjectId}
  onEditProject={openEdit}
  pinned={isPinned(projectId)}
  onTogglePin={togglePin}
  onDeleteProject={confirmDelete}
  onCreateProject={openCreate}
  labelId="project-label"
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `projects` | `{ id, name }[]` | Display order |
| `currentProjectId` | `string` | |
| `onSwitch` | `(id) => void` | |
| `onEditProject` | `(id) => void` | |
| `pinned` | `boolean` | Default `false`. Flips the action to "Unpin project" with the slashed pin |
| `onTogglePin` | `(id) => void` | Read `pinned` for which way |
| `onDeleteProject` | `(id) => void` | **Confirm in a `Dialog` before deleting.** See below |
| `onCreateProject` | `() => void` | |
| `labelId` | `string` | The label's `id`. The trigger is named "Project FY2026 H1 close" |

## Submenu

Edit project · Pin project · Copy project ID · Delete project, in that order.

**Delete is destructive in text colour only** (`MenuItem variant="danger"`), tinted on highlight. It does not delete: it calls `onDeleteProject`, and the caller confirms in a `Dialog`. A menu row is one click from an irreversible action, and the menu has already closed by then, so the confirmation cannot live here.

Copy project ID confirms in place ("Copied", 1.5s, announced). There is no toast in the system.

Everything else, from trigger states and alignment to truncation and keyboard, is `ContextSwitcher`'s; see its README.
