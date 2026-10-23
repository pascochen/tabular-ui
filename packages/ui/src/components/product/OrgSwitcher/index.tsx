import { ContextSwitcher, type ContextItem } from '../ContextSwitcher';

export type Org = ContextItem;

export type OrgSwitcherProps = {
  /** Every organization the user belongs to, in display order. */
  orgs: Org[];
  currentOrgId: string;
  /** Called with the chosen org's id. Not called for the current org — picking it only closes the menu. */
  onSwitch: (orgId: string) => void;
  /** Starts the create-workspace flow. */
  onCreateOrg: () => void;
  className?: string;
};

/**
 * OrgSwitcher — product. `ContextSwitcher` with the workspace wording and the
 * `compact` trigger, for the sidebar header where it shares the band with the
 * sidebar toggle.
 *
 * No submenu: workspace settings live in `AccountMenu`, so the current row
 * carries only its trailing check.
 *
 * Behaviour, alignment and truncation all live in `ContextSwitcher`; see its
 * README.
 */
function OrgSwitcher({ orgs, currentOrgId, onSwitch, onCreateOrg, className }: OrgSwitcherProps) {
  return (
    <ContextSwitcher
      items={orgs}
      currentId={currentOrgId}
      onSwitch={onSwitch}
      label="Workspaces"
      // Title case by request (2026-10-08), unlike the sentence-case rows elsewhere.
      createLabel="Create Workspace"
      onCreate={onCreateOrg}
      trigger="compact"
      className={className}
    />
  );
}

export { OrgSwitcher };
