import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CaretDownIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { useCallback, type ComponentProps } from 'react';

import { cn } from '../../../lib/utils';
import { chipVariants } from '../Chip/variants';
import { inputVariants } from '../Input/variants';
import { popupItem, popupLabel, popupList, popupSeparator, popupSurface } from '../popupSurface';

/**
 * Combobox — foundational. The last of the 14.
 *
 * A `Select` with a filter. Reach for it once a list is long enough that
 * scanning it is work — model names, accounts, schemas — and for the
 * multi-select case, which `Select` deliberately does not cover.
 *
 * **Composed from our own `Input`, not shadcn's `InputGroup`.** The vendored
 * source depends on an `InputGroup` component that is not among the 14, and
 * `CLAUDE.md` forbids adding a fifteenth without asking. Reusing
 * `inputVariants` is also the better outcome: a combobox field is visually
 * identical to every other field in a form, which an InputGroup wrapper would
 * not have guaranteed.
 */
const Combobox = ComboboxPrimitive.Root;
const ComboboxCollection = ComboboxPrimitive.Collection;
const ComboboxValue = ComboboxPrimitive.Value;

/**
 * The field. Renders as an `Input` with the caret and clear affordances
 * layered on the trailing edge — `relative` wrapper rather than a grid, so the
 * text baseline is untouched.
 */
function ComboboxInput({
  className,
  disabled = false,
  showTrigger = true,
  showClear = false,
  size = 'default',
  content = 'text',
  ...props
}: Omit<ComboboxPrimitive.Input.Props, 'size'> & {
  showTrigger?: boolean;
  showClear?: boolean;
  // `size` is omitted above: the HTML input attribute of that name is a
  // character count, and intersecting it with our scale resolves to never.
  size?: 'sm' | 'default' | 'lg';
  content?: 'text' | 'numeric' | 'mono';
}) {
  return (
    <div data-slot="combobox-input-wrapper" className={cn('relative w-full', className)}>
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        disabled={disabled}
        className={cn(
          inputVariants({ size, content }),
          // Room for whichever affordance sits on the trailing edge.
          showTrigger || showClear ? 'pr-[var(--h-control-sm)]' : undefined,
        )}
        {...props}
      />
      <div className="absolute inset-y-0 right-[2px] flex items-center">
        {showClear ? (
          <ComboboxClear disabled={disabled} />
        ) : showTrigger ? (
          <ComboboxTrigger disabled={disabled} />
        ) : null}
      </div>
    </div>
  );
}

function ComboboxTrigger({ className, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label="Open list"
      className={cn(
        'inline-flex size-[var(--h-control-sm)] items-center justify-center rounded-xs',
        'text-text-secondary outline-none hover:text-text-body',
        'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
        'focus-visible:outline-offset-[length:var(--ring-offset)]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CaretDownIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-sm)]" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      aria-label="Clear"
      className={cn(
        'inline-flex size-[var(--h-control-sm)] items-center justify-center rounded-xs',
        'text-text-secondary outline-none hover:text-text-body',
        'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
        'focus-visible:outline-offset-[length:var(--ring-offset)]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <XIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-sm)]" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 4,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'>) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            ...popupSurface,
            'group/combobox-content relative max-h-(--available-height)',
            'w-(--anchor-width) max-w-(--available-width) overflow-hidden',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

/**
 * Marks which ends of a scroll container still hide content, as
 * `data-overflow-y-start` / `data-overflow-y-end`, the attribute names Base
 * UI's ScrollArea uses. Combobox has no scroll arrows of its own (Base UI
 * ships them for Select only), so the list draws its own cue from these.
 *
 * Attributes are set on the element directly rather than through state: they
 * change on every scroll, and a re-render of every row per scroll event buys
 * nothing. Filtering changes the content height without resizing the list
 * once it sits at max-height, hence the MutationObserver beside the
 * ResizeObserver.
 */
function useOverflowEdges() {
  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const update = () => {
      // 1px, not 0: a fractional scrollTop at either end must not leave a fade.
      const below = el.scrollHeight - el.clientHeight - el.scrollTop;
      el.toggleAttribute('data-overflow-y-start', el.scrollTop > 1);
      el.toggleAttribute('data-overflow-y-end', below > 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  const edgesRef = useOverflowEdges();
  return (
    <ComboboxPrimitive.List
      ref={edgesRef}
      data-slot="combobox-list"
      className={cn(
        // Named group so ComboboxEmpty can react to it: Base UI puts
        // `data-empty` on the LIST, not on the Empty element.
        'group/combobox-list',
        'max-h-[min(18rem,var(--available-height))]',
        'overflow-y-auto overscroll-contain',
        popupList,
        'data-empty:p-0',
        // The "more below / above" cue. A fixed max-height cannot promise a
        // half-row peek: 24px labels and separators make the rhythm uneven,
        // and in Grouped the cut fell exactly on a row boundary, so the list
        // looked complete. Overlay scrollbars give no cue either.
        //
        // A mask, not a painted gradient: rows fade to transparent and the
        // popup's own ground shows through, so there is no colour to pick,
        // nothing hue-bearing, and it holds on surface-raised in both modes
        // (§4 elevation is untouched). 24px, --h-row-xs, is the band Select's
        // scroll arrows occupy, so both lists say "more" over the same depth.
        'data-[overflow-y-start]:mask-t-from-[calc(100%-var(--h-row-xs))]',
        'data-[overflow-y-end]:mask-b-from-[calc(100%-var(--h-row-xs))]',
        // Keyboard navigation scrolls the highlighted row into view; padding
        // the snap by the fade depth keeps it clear of the faded band.
        'scroll-py-[var(--h-row-xs)]',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        ...popupItem,
        'text-base',
        // Selection is the interactive role (§4) — same as Select items.
        'data-[selected]:bg-bg-interactive data-[selected]:text-text-primary',
        className,
      )}
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator
        render={<span className="flex w-[var(--size-icon-sm)] shrink-0 items-center justify-center" />}
      >
        <CheckIcon weight="bold" aria-hidden="true" />
      </ComboboxPrimitive.ItemIndicator>
      <span className="flex-1 truncate">{children}</span>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={cn('scroll-my-1', className)} {...props} />;
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel data-slot="combobox-label" className={cn(...popupLabel, className)} {...props} />
  );
}

/**
 * Shown when the filter matches nothing. An empty list with no explanation
 * reads as a bug.
 *
 * **Place it inside `ComboboxList`.** Base UI sets `data-empty` on the list,
 * not on this element, so it hides and reveals via the list as a group.
 *
 * **`data-empty` reflects Base UI's collection, not the DOM.** Pass `items` to
 * `Combobox`, or the list is considered empty no matter how many `ComboboxItem`
 * children are rendered by hand, and this message shows on top of a full list.
 */
function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'hidden group-data-empty/combobox-list:block',
        'px-[var(--pad-cell-x)] py-[var(--pad-cell-y)] text-sm text-text-secondary',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({ className, ...props }: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator data-slot="combobox-separator" className={cn(popupSeparator, className)} {...props} />
  );
}

/** Multi-select. The container behaves as the field, so it carries the Input treatment. */
function ComboboxChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        inputVariants({ size: 'default' }),
        'flex h-auto min-h-[var(--h-control)] flex-wrap items-center',
        'gap-[var(--gap-chip)] py-[var(--pad-chip-y)]',
        'focus-within:outline-ring focus-within:outline-[length:var(--ring-width)]',
        'focus-within:outline-offset-[length:var(--ring-offset)]',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Reuses `chipVariants` rather than restyling. Base UI owns the chip's
 * behaviour here — it is not our `Chip` component, which is a `<button>` with
 * its own dismiss handling — but it must not look like a second kind of chip.
 */
function ComboboxChip({ className, children, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(chipVariants({ size: 'sm' }), 'cursor-default', className)}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ChipRemove
        aria-label="Remove"
        className={cn(
          'relative z-10 -mr-[2px] inline-flex items-center justify-center rounded-xs',
          'text-text-secondary outline-none hover:text-text-body',
          'focus-visible:outline-ring focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
          'focus-visible:outline-offset-[length:var(--ring-offset)]',
        )}
      >
        <XIcon weight="bold" aria-hidden="true" className="size-[var(--size-icon-xs)]" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxPrimitive.Chip>
  );
}

/** The bare input inside a chips container — no border of its own. */
function ComboboxChipsInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chips-input"
      className={cn(
        'h-[var(--h-control-sm)] min-w-24 flex-1 bg-transparent text-base text-text-body',
        'outline-none placeholder:text-text-tertiary',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for each part, so product code can wrap a part and pass the rest
 * through (`function ModelSelect(props: SelectProps<string>)`). Derived from
 * the parts themselves, so they cannot drift; the generic root keeps its
 * type parameters.
 */
export type ComboboxProps<Value, Multiple extends boolean | undefined = false> = ComboboxPrimitive.Root.Props<
  Value,
  Multiple
>;
export type ComboboxChipProps = ComponentProps<typeof ComboboxChip>;
export type ComboboxChipsProps = ComponentProps<typeof ComboboxChips>;
export type ComboboxChipsInputProps = ComponentProps<typeof ComboboxChipsInput>;
export type ComboboxClearProps = ComponentProps<typeof ComboboxClear>;
export type ComboboxCollectionProps = ComponentProps<typeof ComboboxCollection>;
export type ComboboxContentProps = ComponentProps<typeof ComboboxContent>;
export type ComboboxEmptyProps = ComponentProps<typeof ComboboxEmpty>;
export type ComboboxGroupProps = ComponentProps<typeof ComboboxGroup>;
export type ComboboxInputProps = ComponentProps<typeof ComboboxInput>;
export type ComboboxItemProps = ComponentProps<typeof ComboboxItem>;
export type ComboboxLabelProps = ComponentProps<typeof ComboboxLabel>;
export type ComboboxListProps = ComponentProps<typeof ComboboxList>;
export type ComboboxSeparatorProps = ComponentProps<typeof ComboboxSeparator>;
export type ComboboxTriggerProps = ComponentProps<typeof ComboboxTrigger>;
export type ComboboxValueProps = ComponentProps<typeof ComboboxValue>;

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
};
