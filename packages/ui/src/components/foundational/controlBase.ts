/**
 * Shared control contract — two layers, because they are not the same thing.
 *
 * `controlBase` is what EVERY control carries: shape, focus ring, disabled.
 * `pressableBase` is what button-likes add on top: centred content, a hover
 * and press overlay, and a label weight.
 *
 * The split exists because the first version conflated them and `Input`
 * exposed it — `select-none` would have blocked selecting a field's own text,
 * `justify-center` would have centred the value, `font-medium` would have set
 * the value in a label weight, and a hover-fill overlay makes no sense on a
 * text field. Anything added here must be true of a text input, a button, a
 * select and a tab alike; if it is not, it belongs in `pressableBase` or in
 * the component.
 *
 * Not a component, deliberately: no control may quietly diverge from another
 * on focus or disabled behaviour, and importing one component's variants into
 * another would make that component the de facto owner of a layer-wide
 * contract.
 */
export const controlBase = [
  'rounded-md bg-clip-padding transition-colors', // §7.7 controls are --radius-md (since 2026-10-15), 0px since 2026-10-16

  // §4 focus ring: outline, never box-shadow. A ring-* utility compiles to
  // box-shadow and gets clipped by overflow:hidden on scrolling tables.
  'outline-none focus-visible:outline-ring',
  'focus-visible:outline-solid focus-visible:outline-[length:var(--ring-width)]',
  'focus-visible:outline-offset-[length:var(--ring-offset)]',

  // Disabled recedes as a whole. --color-text-disabled dims a label but leaves
  // a solid fill at full strength, which reads as enabled.
  // Both states, because `disabled:` matches the native attribute only. A Base
  // UI part that is not a native control (Checkbox's <span>) or that stays
  // focusable when disabled (a Tab) carries data-disabled instead, and shipped
  // at full strength. Bracketed: the `data-disabled:` shorthand compiles inside
  // :where(), with zero specificity.
  'disabled:pointer-events-none disabled:opacity-50',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
];

/**
 * §4 hover and press. They COMPOSITE over the control's own ground and never
 * swap the fill, so one overlay stays correct over a solid fill, over a
 * bordered transparent ground, and over the bare canvas.
 *
 * Separate from `pressableBase` because a Select trigger needs the overlay but
 * not the rest of it — its value is left-aligned and set in the body weight,
 * like an Input's, not centred in a label weight like a Button's. Requires
 * `relative` on the element.
 */
export const controlOverlay = [
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
  'hover:after:bg-bg-hover active:after:bg-bg-active',
];

/**
 * Button-likes only — anything the user presses rather than types into, whose
 * content is a centred label rather than a value.
 */
export const pressableBase = [
  'relative inline-flex shrink-0 select-none items-center justify-center',
  'whitespace-nowrap border border-transparent font-medium', // §8.5 weight 500
  ...controlOverlay,
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
];

/**
 * The grounds for pressable controls. Only `danger` carries a hue —
 * everything else is neutral, per §0 rule 1: colour means state, not hierarchy.
 */
export const controlGrounds = {
  // Primary action is the interactive role (§1), an ink fill. The shared
  // overlay is ink too, so on this fill it changed nothing: the ground points
  // the overlay at the other mode's colour instead (§4, inverse overlay).
  // On the --tui-* layer, because `@theme inline` inlines it (§9).
  default:
    'bg-fill-interactive text-on-interactive [--tui-bg-hover:var(--tui-bg-hover-inverse)] [--tui-bg-active:var(--tui-bg-active-inverse)]',
  outline: 'border-border text-text-body',
  ghost: 'text-text-body',
  // Tint, not solid: a permanently-red solid control in a toolbar competes
  // with genuine failure state in the data.
  danger: 'bg-bg-danger text-text-danger',
  /** @deprecated Use `danger` (renamed 2026-10-10, `dangerVariant.ts`). Same ground; still honoured. */
  destructive: 'bg-bg-danger text-text-danger',
  // A control embedded in another component's structure: a sortable column
  // header, a tree row, a tree's expand caret. No ground, no border, no hover
  // fill (the row around it owns hover). Size, colour and alignment come from
  // the context; weight is normal, so a caller that wants more sets it.
  // Case is inherited explicitly: browsers give <button> text-transform:none,
  // so without it every sortable DataTable header ignored its cell's
  // `uppercase` and rendered mixed case (found 2026-10-09).
  // Button and IconButton drop their size variant for it, so it adds no
  // height or padding either. Exists so those places use the real control,
  // with Base UI's behaviour and the system focus ring, instead of a
  // hand-styled <button> (CLAUDE.md, "Never re-implement a primitive inline").
  inline: 'border-0 font-normal [text-transform:inherit] after:hidden',
} as const;
