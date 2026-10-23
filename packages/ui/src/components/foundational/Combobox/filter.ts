import { Combobox as ComboboxPrimitive } from '@base-ui/react';

/**
 * Base UI's filter hook — the thing that actually narrows the list.
 *
 * Separate module so index.tsx exports only components: react-refresh disables
 * fast refresh for any file mixing component and non-component exports.
 *
 * shadcn's vendored file also exported a local `useComboboxAnchor` helper; it
 * is not a Base UI export and is not reproduced here. To anchor the popup to a
 * chips container instead of the input, pass your own ref to
 * `ComboboxContent`'s `anchor` prop, which Base UI's Positioner takes directly.
 */
export const useComboboxFilter = ComboboxPrimitive.useFilter;
