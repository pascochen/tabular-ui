# OrgSwitcher

Product. `ContextSwitcher` with the workspace wording and the `compact` trigger, and no submenu.

The sidebar header's workspace switcher. The component and its props keep the `org` names; only the visible copy says "workspace". Goes in `AppShell`'s `sidebarHeader` slot.

```tsx
<OrgSwitcher
  orgs={orgs}
  currentOrgId={orgId}
  onSwitch={setOrgId}
  onCreateOrg={openCreateOrg}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `orgs` | `{ id: string; name: string }[]` | Every org the user belongs to, in display order |
| `currentOrgId` | `string` | The org shown on the trigger and checked in the menu |
| `onSwitch` | `(orgId) => void` | Picking another org. The menu closes |
| `onCreateOrg` | `() => void` | The create-workspace flow |
| `className` | `string` | Applied to the trigger |

Both handlers are required, so a consumer cannot ship a menu row that does nothing.

## Menu

Workspaces → one row per org → Create Workspace. "Create Workspace" is title case by request (2026-10-08), unlike the sentence-case rows elsewhere.

The current org has **no submenu**: workspace settings live in `AccountMenu`, and Copy organization ID was dropped. So the current row carries its check at the trailing edge, where the chevron was, and picking it only closes the menu. With no leading check, names start at the row padding and the create row's plus starts with them, as in the Figma draft.

The menu is `Menu`'s `spaced` density: 36px rows 4px apart, with no shadow in either mode (§4).

Everything else, from the trigger to alignment, truncation, keyboard and the copy confirmation, is `ContextSwitcher`'s; see its README. `apps/storybook/tests/org-switcher.spec.ts` exercises it through this wrapper.
