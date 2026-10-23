# Field

Product. Label, control, and help or error text — wired together.

```tsx
<Field label="Model name" required error="A model named fct_gl_entries already exists.">
  {(p) => <Input {...p} content="mono" />}
</Field>
```

## Why a render prop

The foundational controls deliberately do not render their own labels — that would put label layout inside every one of them. This is where the association lives, and children are a **function** because the wiring is the whole point: the control receives the generated `id`, `aria-describedby` pointing at whichever message is showing, and `aria-invalid`.

A plain child would leave that to the call site, which is precisely where it gets forgotten. The render prop makes the correct thing the only convenient thing.

## Error replaces help

They do not stack. Two messages under one control is a reading-order problem, and the error is always the one that matters. `aria-describedby` therefore always points at exactly one message.

`required` renders a marker on the label but is `aria-hidden`, so the asterisk is not announced twice. The render prop carries `required` and `aria-required` to the control, and those are what assistive technology reads. Spread them onto a native control. A custom control whose root is not a form element takes `aria-required` only — `SelectTrigger` is a button, and `required` is invalid there:

```tsx
<Field label="Materialization" required>
  {(p) => (
    <Select>
      <SelectTrigger id={p.id} aria-describedby={p['aria-describedby']} aria-required={p['aria-required']}>
        …
```

## What the render prop receives

| Prop | Value |
|---|---|
| `id` | Generated; the label's `htmlFor` points at it |
| `aria-describedby` | The help or error message's id, or `undefined` when neither shows |
| `aria-invalid` | `true` when `error` is set |
| `required` | `true` when `required` is set |
| `aria-required` | `true` when `required` is set |

The type is exported as `FieldControlProps`.

## Props

| Prop | Type | |
|---|---|---|
| `label` | `string` | Required. The visible label. |
| `children` | `(props: FieldControlProps) => ReactNode` | Required. Renders the control. |
| `help` | `ReactNode` | Guidance under the control. Hidden while `error` is set. |
| `error` | `ReactNode` | Validation message. Marks the control invalid. |
| `required` | `boolean` | Label marker plus `required` / `aria-required` on the control. |
| `className` | `string` | On the wrapper. |
