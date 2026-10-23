import { CaretDownIcon, CheckIcon, CopyIcon, PlusIcon } from '@phosphor-icons/react';
import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../foundational/Button';
import { popupRowInset } from '../../foundational/popupSurface';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from '../../foundational/Menu';
import { TruncatedText } from '../TruncatedText';

export type ContextItem = { id: string; name: string };

/**
 * One row of the current item's submenu. `copy-id` is built in because it owns
 * state — the "Copied" confirmation and its live-region announcement — that a
 * plain callback could not carry.
 */
export type ContextAction =
  | {
      type: 'item';
      label: string;
      /** A Phosphor icon element. Its weight is set here (§11.2 ≤16px floor). */
      icon: ReactElement<{ weight?: string }>;
      onSelect: (id: string) => void;
      /** `destructive` is the deprecated spelling of `danger` (renamed 2026-10-10), still honoured. */
      variant?: 'default' | 'danger' | 'destructive';
    }
  | {
      type: 'copy-id';
      label: string;
      /** Announced to assistive technology after a copy — "Project ID copied". */
      announcement: string;
    };

export type ContextSwitcherProps = {
  /** Every item the user can switch to, in display order. */
  items: ContextItem[];
  currentId: string;
  /** Called with the chosen item's id. Not called for the current item. */
  onSwitch: (id: string) => void;
  /** The menu's section label — "Workspaces", "Projects". */
  label: string;
  /**
   * The current item's submenu, top to bottom. Omit it when the current item
   * has nothing to configure here: its row then only closes the menu, and the
   * check moves to the trailing edge, where the chevron would have been.
   */
  actions?: ContextAction[];
  /** The create row's label — "Create project". */
  createLabel: string;
  onCreate: () => void;
  /**
   * `compact` sizes the trigger to its name with the caret beside it — the
   * sidebar header, where a toggle shares the band. `block` fills its
   * container with the caret at the far edge — a section under a
   * `ContextSwitcherLabel`.
   */
  trigger?: 'compact' | 'block';
  /** The `id` of a `ContextSwitcherLabel` naming this switcher. `block` only. */
  labelId?: string;
  className?: string;
};

/** How long a copy action reads "Copied" after a copy. */
const COPIED_MS = 1500;

/**
 * A row's tooltip anchors to the name, not the row, so to clear the popup it
 * must travel the rest of the way out — `popupRowInset()`, the row padding,
 * list inset and border read from their tokens — then Tooltip's own 4px gap.
 * A function, so Base UI calls it when it positions the tooltip: the tokens
 * are read then, not restated here.
 */
const rowTooltipOffset = () => popupRowInset() + 4;

const triggerClasses = {
  // `shrink` undoes Button's `shrink-0`; without it `min-w-0` does nothing and
  // a long name pushes the trigger past the sidebar.
  compact: 'min-w-0 shrink px-[var(--pad-sidebar-item)]',
  block: [
    'w-full min-w-0 justify-between gap-[var(--gap-inline)] px-[var(--pad-sidebar-item)]',
    // Plain text at rest — Button's ghost ground is already transparent and
    // borderless. Hover adds the shared overlay; the text steps up one tier.
    'hover:text-text-primary',
    // Open keeps the hover fill, so the trigger reads as the menu's anchor
    // while the pointer is in the menu. Base UI marks it `data-popup-open`.
    'data-[popup-open]:text-text-primary data-[popup-open]:after:bg-bg-hover',
  ],
};

/**
 * ContextSwitcher — product. Composes `Menu`, `Button` and `TruncatedText`.
 *
 * Switches the context the rest of the screen is about: organization,
 * project. `OrgSwitcher` and `ProjectSwitcher` are this component with their
 * wording; reach for one of those before using this directly.
 *
 * With `actions`, the current item is the only row with a submenu — its own
 * actions — so the rows that switch and the row that configures are never the
 * same gesture. Every row then reserves the same `--size-icon-sm` leading
 * slot, holding the check, the plus or nothing, so the names line up — the
 * same mechanism `MenuCheckboxItem` uses for its indicator.
 *
 * Without `actions`, the trailing edge is free, so the check goes there and
 * the leading slot goes away: names start at the row padding, and the plus on
 * the create row starts with them.
 *
 * **The check is neutral.** Which item is current is carried by shape (the
 * check), position and the accessible name. A hue here would be colour as
 * hierarchy (§0 rule 1).
 *
 * Submenu timing, flip and keyboard are Base UI's: 100ms hover delay, opens
 * inline-end and flips on collision, Right/Enter opens, Left/Esc closes only
 * the submenu (`closeParentOnEsc` defaults to false), a second Esc closes the
 * menu and returns focus to the trigger. None of it is re-implemented here.
 */
function ContextSwitcher({
  items,
  currentId,
  onSwitch,
  label,
  actions,
  createLabel,
  onCreate,
  trigger = 'compact',
  labelId,
  className,
}: ContextSwitcherProps) {
  const current = items.find((i) => i.id === currentId);
  const triggerId = useId();
  const [copied, setCopied] = useState(false);
  const copyAction = actions?.find((a) => a.type === 'copy-id');
  // No submenu, so the trailing edge holds the check instead of a chevron.
  const trailingCheck = !actions?.length;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const copyId = () => {
    // A rejected write (insecure context, denied permission) leaves the label
    // alone: "Copied" must never appear for a copy that did not happen.
    navigator.clipboard.writeText(currentId).then(
      () => setCopied(true),
      () => {},
    );
  };

  const block = trigger === 'block';

  return (
    <>
      <Menu>
        <MenuTrigger
          id={triggerId}
          // Label, then own content: "Project, FY2026 H1 close". The
          // label alone would drop which project is current.
          aria-labelledby={block && labelId ? `${labelId} ${triggerId}` : undefined}
          render={<Button variant="ghost" className={cn(triggerClasses[trigger], className)} />}
        >
          {/*
            Below: compact, inline-end is the caret and then the sidebar
            toggle; block, it is the caret and then the sidebar's edge.
          */}
          <TruncatedText side="bottom" className={cn('flex-1 text-left', !block && 'flex-initial')}>
            {current?.name ?? ''}
          </TruncatedText>
          <CaretDownIcon weight="bold" aria-hidden="true" />
        </MenuTrigger>
        <MenuContent
          align="start"
          // Block: as wide as the trigger, so the menu reads as dropping out
          // of it. Compact: capped at the sidebar's width, --w-sidebar (§7.9).
          // Spaced: picked from the sidebar, not scanned over a table (popupSpaced).
          density="spaced"
          className={block ? 'w-(--anchor-width)' : 'max-w-[var(--w-sidebar)]'}
        >
          <MenuGroup>
            <MenuLabel>{label}</MenuLabel>
            {items.map((item) =>
              item.id === currentId && trailingCheck ? (
                // A plain row: picking it closes the menu and switches nothing.
                <MenuItem key={item.id} aria-label={`${item.name}, current`}>
                  {/* Above: the check sits inline-end, so rowTooltipOffset would land inside the popup. */}
                  <TruncatedText side="top" className="flex-1 text-left">
                    {item.name}
                  </TruncatedText>
                  <CheckIcon weight="bold" aria-hidden="true" />
                </MenuItem>
              ) : item.id === currentId ? (
                <MenuSub key={item.id}>
                  {/*
                    aria-label, not an sr-only suffix: the name and the suffix
                    are separate flex items, and Chrome joins those with a
                    space ("Asia , current"). It starts with the visible
                    name, so label-in-name (WCAG 2.5.3) holds.
                  */}
                  <MenuSubTrigger aria-label={`${item.name}, current`}>
                    <LeadingSlot>
                      <CheckIcon weight="bold" aria-hidden="true" />
                    </LeadingSlot>
                    {/* Above: inline-end is where this row's submenu opens. */}
                    <TruncatedText side="top" className="flex-1 text-left">
                      {item.name}
                    </TruncatedText>
                  </MenuSubTrigger>
                  <MenuSubContent>
                    {actions?.map((action) =>
                      action.type === 'copy-id' ? (
                        // Stays open so "Copied" is seen where the click landed.
                        <MenuItem key={action.label} closeOnClick={false} onClick={copyId}>
                          <CopyIcon weight="bold" aria-hidden="true" />
                          {copied ? 'Copied' : action.label}
                        </MenuItem>
                      ) : (
                        <MenuItem key={action.label} variant={action.variant} onClick={() => action.onSelect(item.id)}>
                          <ActionIcon icon={action.icon} />
                          {action.label}
                        </MenuItem>
                      ),
                    )}
                  </MenuSubContent>
                </MenuSub>
              ) : (
                <MenuItem key={item.id} onClick={() => onSwitch(item.id)}>
                  {!trailingCheck && <LeadingSlot />}
                  <TruncatedText side="inline-end" sideOffset={rowTooltipOffset} className="flex-1 text-left">
                    {item.name}
                  </TruncatedText>
                </MenuItem>
              ),
            )}
          </MenuGroup>
          <MenuSeparator />
          <MenuItem onClick={onCreate}>
            {trailingCheck ? (
              <PlusIcon weight="bold" aria-hidden="true" />
            ) : (
              <LeadingSlot>
                <PlusIcon weight="bold" aria-hidden="true" />
              </LeadingSlot>
            )}
            {createLabel}
          </MenuItem>
        </MenuContent>
      </Menu>
      {/*
        A label that changes under focus is not reliably announced, so the
        confirmation also goes to a polite live region. It lives outside the
        menu's portal so it exists before the text changes.
      */}
      {copyAction && (
        <span role="status" className="sr-only">
          {copied ? copyAction.announcement : ''}
        </span>
      )}
    </>
  );
}

/**
 * A section label for a `block` switcher — "Project" above the trigger.
 *
 * The §8.1 micro-label tier, the same treatment `AppShellNavGroup` gives its
 * label, so a sidebar's section labels read as one set — including its colour,
 * `--color-text-secondary`: tertiary measured 3.78:1 on the sidebar's
 * `--color-surface` in dark mode, and a section label is read. Its inline padding is
 * the trigger's, `--pad-sidebar-item`, and it carries the same 1px transparent
 * inline border `Button` does, so the label's text and the trigger's text
 * start on the same x. Padding alone lands the label 1px short.
 *
 * Give it an `id` and pass that to the switcher's `labelId`.
 */
function ContextSwitcherLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="context-switcher-label"
      className={cn(
        'border-x border-transparent px-[var(--pad-sidebar-item)] text-2xs font-medium uppercase tracking-[var(--tracking-wide)] text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}

/** The fixed-width icon column every row shares, so names align with or without an icon. */
function LeadingSlot({ children }: { children?: ReactNode }) {
  return (
    <span aria-hidden="true" className="flex w-[var(--size-icon-sm)] shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

/**
 * Fills in a caller's icon at §11.2's ≤16px floor — the same injection
 * `IconButton` does. An explicit `weight` on the icon still wins.
 */
function ActionIcon({ icon }: { icon: ReactElement<{ weight?: string; 'aria-hidden'?: boolean }> }) {
  return cloneElement(icon, { weight: icon.props.weight ?? 'bold', 'aria-hidden': true });
}

export { ContextSwitcher, ContextSwitcherLabel };
