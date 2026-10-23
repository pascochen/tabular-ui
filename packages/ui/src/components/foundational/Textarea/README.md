# Textarea

Foundational. Added 2026-10-13 (approved), for the chat composer: the first field in the system that has to hold more than one line.

```tsx
import { Textarea } from 'tabular-ui';

<Field label="Reviewer note">{(p) => <Textarea {...p} />}</Field>
<Textarea aria-label="Message" variant="borderless" minRows={1} maxRows={6} />
```

## Written, not `shadcn add`ed

shadcn's Base UI textarea is a plain `<textarea>` carrying a `cn-textarea` class, whose geometry lives in `style-mira.css`: a filled ground, a `ring-2` box-shadow focus ring and a 64px minimum. `tools.md` says to author a component like that rather than install it. Base UI has no textarea part, and the browser's is already complete, so there is no behaviour to adopt. This file is the token layer.

## The same box as `Input`

Transparent ground, 1px `--color-border`, `--radius-md`, `--pad-control-x`, `--text-base` in `--color-text-body`, `--color-text-tertiary` placeholder. Invalid tints the border with `--color-border-danger`, and disabled fades the field through `controlBase`, as in `Input`. A one-line textarea and an input set side by side are indistinguishable until you type a second line.

There is no `size` or `content` prop yet. Free text is the only use so far. Add `mono` when a screen needs SQL or identifiers in a multi-line field, and follow `Input`'s compound variants for the size step (§8.3).

## `variant`

| `variant` | | |
|---|---|---|
| `default` | A field in its own right | Border, padding, focus ring and disabled fade, as above. |
| `borderless` | A field inside a container that draws the box | No border, no padding, and no focus ring or disabled fade of its own. N lines are exactly N line-heights. |

**A `borderless` field has no visible focus unless its container draws one.** The container takes the border and the ring on `has-[textarea:focus-visible]` (outline, `outline-solid`, `--ring-width`, `--ring-offset`), and fades itself when disabled. `ChatComposer` is the worked example. Approved 2026-10-13 for it, after a benchmark showed every chat composer puts Send inside the message box.

## Scroll cue

Once the text passes `maxRows`, the field marks which edges hide text with `data-overflow-y-start` and `data-overflow-y-end`, the same attributes Base UI sets on `Combobox`'s list. In `borderless`, the line at a hiding edge fades out through a mask (§4 *Scroll cue*), so overflow reads as "there's more" instead of a line cut through its glyphs. The `default` variant doesn't mask: the fade would take its border with it. Both variants use a thin scrollbar.

The attributes update on scroll and input, and when `value` changes from outside (a field cleared after sending fires no input event).

## Height

| Prop | Default | |
|---|---|---|
| `minRows` | 3 | Lines shown when empty. The field never gets shorter. |
| `maxRows` | none | Lines it grows to before it scrolls. Omit to grow with the text. |

It grows with its text through `field-sizing: content`, so no script measures it. The heights come from the control height instead of restating it. The vertical padding is `(--h-control − 1lh − 2px) / 2`, which puts one line at exactly `--h-control` (32px). Each further line adds one line-height (20px): 1 line is 32px, 3 lines 72px, 6 lines 132px. In `borderless` there is no padding or border, so N lines are N line-heights: the container's padding does that job.

That is a *content* height, not a control height. §7.6's 36px cap is on `--h-*` tokens. A field holding six lines of text is sized by its text, like a header band (§7.3), and its one-line state is still `--h-control`.

`rows` is set to `minRows`. Where `field-sizing` is unsupported, the field stays at its minimum and scrolls rather than growing. Firefox's support is unchecked: the browser tests run Chromium only.

`resize` is off: the field sizes itself, and a drag handle in a 440px panel footer fights the layout.

## Labels are the caller's job

As for `Input`. `Field` passes `id`, `aria-describedby`, `aria-invalid` and `required` through its render prop, and they all apply to a `<textarea>`.
