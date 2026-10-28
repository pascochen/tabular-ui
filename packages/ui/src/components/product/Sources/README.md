# Sources

Product. Composed from `AttachmentRow`. Pairs with `InlineCitation`.

What an answer rests on, numbered, and what wasn't checked.

```tsx
<Sources
  sources={[
    { id: 'invoices', name: 'supplier_invoices_fy2026_h1.csv', size: '116 KB', href: '/files/invoices' },
    { id: 'interview', name: '05_interview_ar_ap_2026-10-14.txt', size: '4 KB', href: '/files/interview' },
  ]}
  notChecked={['Invoices after September: the supplier file covers H1.']}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `sources` | `Source[]` | Required. Numbered from 1 in the order given: citation order |
| `notChecked` | `ReactNode[]` | **Required.** One sentence each, naming the part and why. Nodes, so a file name in one can be mono. `[]` says every part was checked |
| `className` | `string` | |

`Source` is `{ id, name, size?, href?, render? }`, and `InlineCitation` takes the same object, so a mark and its row can't name different files.

## Geometry

Two labelled lists, `--gap-group` (12px) apart. Each label is `--text-xs`, medium, `--color-text-secondary`, `--gap-bonded` above its list. A source is an `AttachmentRow` (28px) with its number in front. A not-checked line has `--pad-cell-x` and `--pad-cell-y`, so one line is 28px too and the two lists keep one rhythm. A longer sentence wraps.

## Mechanisms worth knowing

**`notChecked` is required.** agent-voice.md's principle 4 is "Say what was not checked": confidence comes from scope, not adjectives. A rule the component can enforce belongs in the component (CLAUDE.md, failure log: `Button`'s icon weight), so an answer can't list its sources and stay silent about where they stop. `[]` is a claim as well, and the component writes it out: "Nothing. Every part of the question was checked." Pass it only when that's true.

**Not-checked lines wrap; source names truncate.** A file name is an identifier, and `AttachmentRow` truncates it in mono. A not-checked line is a sentence, and a cut sentence says less than the agent meant.

**The number is part of the row.** The hover ground moves from `AttachmentRow` to the list item, so the number and the file light together. Numbers are `tabular-nums`, right-aligned in two figures' width, so 9 and 10 line up.

**Neutral throughout.** A source isn't a state, and neither is a gap in coverage (§0 rule 1). The one hue is the interactive role on a file name that links. A figure that is actually unverified is flagged in the answer, in the warning state (agent-voice.md, *Uncertainty*), not here.

**Inside `AgentBlock` when the agent wrote it.** Like `AgentReasoning` and `AgentPlan`, it's a part of the turn's block and draws no rail of its own.

## Not part of this component

**Where in a source a figure comes from.** That belongs to the figure, so it's `InlineCitation`'s `locator`. The list says which files; each mark says where.

**Status.** The files an answer rests on were read. A file that couldn't be read is something not checked, and goes in that list with its reason.
