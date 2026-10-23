# AttachmentRow

Product. Composed from `StatusBadge`, `ProgressBar` and `IconButton`.

One file — identified, with state — at 28px.

```tsx
<AttachmentRow
  name="stg_sap__bkpf_20260930.csv"
  size="9.4 MB"
  timestamp="14:02"
  status="passed"
  href="/files/8842"
  actions={<IconButton aria-label="Download" size="sm"><DownloadSimpleIcon /></IconButton>}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `name` | `string` | Required. Mono, truncated |
| `size` / `timestamp` | `string` | **Pre-formatted.** The row formats neither bytes nor time |
| `attachedBy` | `string` | The audit trail for evidence pinned to a record |
| `status` | `RunStatus` | §5's vocabulary. Also drives the row treatment |
| `progress` | `number` | 0–100. Replaces size/timestamp with a track |
| `href` / `render` | `string` / element | Makes the filename a link; `render` swaps in a router link |
| `actions` | `ReactNode` | Trailing `IconButton`s |
| `icon` | `Icon` | Overrides the glyph inferred from the extension |

## Geometry

28px via `--h-row-sm`, `--pad-cell-x` (8px) horizontal, `--pad-cell-x` between
elements. A list of these sits flush against `DataTable`, whose rows are the same
height.

## Mechanisms worth knowing

**The filename is the link. The row is not wholly clickable, deliberately.**
shadcn's `Attachment` stretches an invisible `absolute inset-0` trigger across the
card so the whole thing activates, with actions above it at a higher z-index. It is
a real technique for a real problem — a `<button>` cannot live inside an `<a>` — and
it is wrong here:

1. An `inset-0` overlay eats the pointer, so **the filename cannot be selected and
   copied**. Copying `stg_sap__bkpf_20260930.csv` or a GL reference is routine in
   this product, not an edge case.
2. There is no single row action to bind. Evidence wants preview, a pipeline source
   wants its parse errors, an agent file wants download.
3. A stretched trigger has no visible text, so it needs an `aria-label` duplicating
   the filename — two accessible names for one target, and they drift.
4. `DataTable` already owns whole-row activation through `onRowClick`. A second,
   overlay-based mechanism would fork the convention.

If a **card** form ever needs whole-card activation, that is when the stretched
trigger earns its place. Reach for it then, not here.

**Status reuses `runStatuses`; there is no upload vocabulary.** Queued → running →
passed / failed covers an upload, with `needs-review` for a parsed file awaiting
sign-off. shadcn's own five states (`idle | uploading | processing | error | done`)
map onto it with nothing left over. Reaching for a sixth hue to mean "uploading"
breaks §0 rule 2 when `running` already means exactly that.

**File-type glyphs are neutral, all of them.** The instinct is a red PDF and a green
spreadsheet. That is colour used for hierarchy, which §0 rule 1 forbids — shape
carries the type, and the distinction survives grayscale because it was never
chromatic. The map lives in `fileTypes.ts`, split out so `index.tsx` exports only the
component (react-refresh disables fast refresh for mixed-export files).

**Filenames are identifiers, so they render mono one step below the adjacent sans**
(§8.3) — `--text-xs` inside a `--text-sm` row, because mono runs visually larger at
equal px. The `font-mono` utility brings the slashed zero with the family (§8.7).

**The focus ring is inset.** These lists scroll, and an offset ring at a container
edge is clipped — `outline` does not escape `overflow: hidden` any more than
`box-shadow` does.

## Not part of this component

**The upload affordance.** It is a composition, not a component: a bordered
container holding `EmptyState`, whose `action` slot takes a `Button` and a
visually-hidden `<input type="file">`. See the `UploadTarget` story. The browser
supplies the entire file-picking behaviour, so there is nothing to wrap.

Drag-and-drop is not implemented. Click covers every user; drag is a convenience,
and a drop-only target is a WCAG failure regardless. If it is added later, the
depth-counting `dragenter`/`dragleave` handling is authored behaviour and ships with
tests.

**Dashed borders mean a placeholder awaiting content; solid means content.** So the
upload target is dashed while empty and solid once a file lands, and an
`AttachmentRow` holding a real file is never dashed. The rule is in
`docs/design-system.md` §7.8.

## Adoption note

Not vendored. shadcn's `Attachment` ships nine parts and keeps its geometry in
`style-mira.css` rather than in the component — `rounded-lg`, a 40px media well, and
a `focus-within:ring-1 ring-ring/30` box-shadow ring, all of which fail this system's
rules. The technique worth taking from it is documented above; the shape is not.
