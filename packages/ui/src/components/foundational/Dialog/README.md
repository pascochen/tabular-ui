# Dialog

Foundational. Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

Focus trapping, scroll locking and the Escape contract come from Base UI. Our work is the token layer.

```tsx
<Dialog>
  <DialogTrigger render={<Button variant="outline">Open</Button>} />
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Re-run pipeline</DialogTitle>
      <DialogDescription>14 models, roughly 6 minutes.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <DialogClose render={<Button>Re-run</Button>} />
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## The overlay sheet

§4 puts modals a tier above popups: an overlay is `--color-surface-raised` + `--color-border-strong` **plus `--shadow-overlay`** (`shadow-overlay`). That's a second sheet of the dialog's own surface, 4px down and to the right, edged in the same 1px strong rule as the dialog. No blur and no black: a ledger shows one page over another as a stack of ruled sheets, and a riso print can't make a soft shadow. Tooltip, Menu, Select and Popover have no shadow. The sidebar peek is the only other overlay (§4 *Elevation*, decided 2026-10-19).

Never add a `shadow-{colour}` utility here. Tailwind repaints both layers of the sheet with it, and the sheet turns into a solid block with no error. Lint rejects them.

Radius is `--radius-lg` — §7.7's modal/drawer tier, square (0px) since 2026-10-16. The vendored source shipped `rounded-xl`, which is above it.

## Backdrop

Scrims toward `--color-canvas` at 80%, **not** `#000`. Compositing 80% black over a `ledger-950` canvas lands at near pure black, which reintroduces the halation risk §0 rule 9 exists to prevent — here against a bright dialog edge. A `backdrop-blur` does the separation work that a darkening scrim cannot do much of when the page is already dark.

## Bordered controls inside

`DialogContent` redefines `--tui-border` to `--tui-border-strong` for its subtree, the same fix `popupSurface` makes. Without it an `Input` or `Select` inside a dialog renders borderless in dark mode, because §3 gives `--color-border` and `--color-surface-raised` the same value.

Note it overrides the `--tui-*` name, not `--color-border`: §9's `@theme inline` inlines the reference, so `border-border` compiles to `border-color: var(--tui-border)` and overriding the `--color-*` name does nothing.

## Close affordance

An `IconButton` at `sm`, with `tooltip={false}` — a tooltip reading "Close" on the one universally understood control is noise. The `aria-label` still names it.

## Tests

`apps/storybook/tests/dialog.spec.ts` pins both kinds of promise above.

- **Behaviour** (from Base UI, pinned so an upgrade cannot drop it): the dialog is named by its title and described by its description; focus moves in on open and Tab cannot leave; Escape and a backdrop click close it and return focus to the trigger; the X is named "Close"; the page behind cannot scroll while it is open.
- **The visual contract** (ours), in both modes and read from tokens: `--radius-lg`, the overlay sheet, `--color-surface-raised` with `--color-border-strong`, a backdrop that is the canvas colour at 80% rather than black, and a field inside that keeps the strong border. Breaking any one of these fails the test.

The `Open` story renders the dialog open, so the panel, backdrop and close button are screenshotted and checked by axe in both modes; every other story shows only its trigger. It is kept off the Docs page, where an open modal would cover everything.

Focus settles a moment after each move: Base UI's trap uses invisible guard elements that bounce focus back. Assert where focus *settles* (`expect.poll`), not where it is the instant after a key press.
