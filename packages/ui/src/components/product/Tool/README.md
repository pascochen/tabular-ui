# Tool

Product. Each call the agent makes, as one line: what it's doing while it runs, what it did once it has run, and what failed and what happens next when it fails. `ToolGroup` folds calls made in a row into one line.

```tsx
<AgentBlock authorship="AI">
  <ToolGroup
    summary="Read 1 of 2 files"
    calls={[
      {
        id: 'invoices',
        status: 'done',
        running: 'Reading supplier_invoices_fy2026_h1.csv',
        done: 'Read supplier_invoices_fy2026_h1.csv',
      },
      {
        id: 'bank',
        status: 'failed',
        running: 'Reading bank_export_kjp_2026-09.csv',
        error: 'Couldn’t read the columns in bank_export_kjp_2026-09.csv: it has no header row.',
        next: 'I’ll take both payments as the invoice file records them.',
      },
    ]}
  />
</AgentBlock>
```

One call on its own is `<Tool>`, with the same props as a call and no `id`.

## A part of an `AgentBlock`, not a block of its own

Like `AgentReasoning`, it draws no rail and no authorship label: the `AgentBlock` around it carries both §5 signals. The calls sit in the turn that made them, above the answer they led to.

## The decision: done only after it ran

The site's decision line is "An action says it's done only after it ran. A failure says what to do next." The props are built so a caller can't break it:

| `status` | Line | Announced |
|---|---|---|
| `running` | `running`, the present: "Reading `supplier_invoices_fy2026_h1.csv`…", with a `Spinner`; after 3s, "… · 0:07" (§11.5) | nothing: the line says it |
| `done` | `done`, the past: "Read `supplier_invoices_fy2026_h1.csv`" | `done` |
| `failed` | `error`, then `next` under it, both always visible | `error` and `next` |

- **Each state has its own words.** `done` is a prop of its own, shown only when `status` is `done`, so a call that's still running can't read as finished. *Source:* `docs/agent-voice.md` principle 3, "Past tense only when the action ran."
- **A failure can't ship without its next step.** `next` is required on a failed call, in the type. It says what the agent does instead, or what the person can do: "I'll take both payments as the invoice file records them." *Source:* the voice's *Errors state fact, not feeling*: what failed, why if known, what happens next.

## Folded, and calls in a row grouped

- **One line per call, folded.** A line with `detail` opens to what the call read or returned. Without it, the line is plain text, with no caret.
- **It never opens or closes by itself.** That's `AgentReasoning`'s rule, for the same reason: a line that grows and then shrinks moves whatever the reader is looking at below it.
- **A failure is never folded.** Its line has no caret: the error and the next step are the content.
- **`ToolGroup` folds calls made in a row into one line,** with a `summary` in the past: "Read 3 files". While a call runs, the line says what that call is doing, with its own elapsed figure, so the summary shows only once every call has run. Opened, it lists each call as its own line, and each of those opens on its own.
- **A failed call shows under the group's line, open or folded.** Folded, the group shows only its failures. Opened, every call in order, the failure in its place.

Benchmarks (2026-10-28): AI Elements' `Tool` draws each call as a card with its parameters as JSON and a status badge, and opens completed and failed calls by default. That's too much for a 440px panel, and it opens by itself. Its `ChainOfThought` puts several steps under one header that starts closed, which is the shape `ToolGroup` takes.

## Anatomy

| Part | Treatment |
|---|---|
| Line | `--text-sm`, 500, `--color-text-secondary`, `tabular-nums`, as `AgentReasoning`'s summary. With `detail` it's `Button variant="inline"` with a 1em `bold` caret, `aria-expanded` and `aria-controls`; without, a `<p>`. |
| Spinner | After the label while running, its colour. Under reduced motion it stands still, and the figure keeps counting. |
| Detail | Under the label (a hanging indent of 1em plus `--gap-control-icon`), `--gap-field` below the line, `--text-sm`, secondary, `tabular-nums`: what a call read is often figures. Rendered only when open. |
| Failure | An `XCircle` in `--color-text-danger`, `bold`, 1em, in the caret's slot. `error` in `--color-text-body`, 500; `next` under it in secondary, `--gap-bonded` apart. |
| Group | The line, then a list of calls under the label, `--gap-field` apart. |
| Live region | A visually hidden `role="status"` beside the line, not in it, where it would join the button's name. It says a call finishing or failing, holds it 7s, then empties (`useAnnouncement`, shared with `AgentReasoning`). Running isn't announced, and a call that mounts already settled announces nothing. A group announces its summary when the last call has run, and each failure as it lands. |

The failure is the one hue: it's a state (§0 rule 1). Running and done are neutral. A done call has no check mark: the past tense says it, and a column of green ticks would turn every read into a success.

## Copy

- **`running`:** a verb in the present and the thing it acts on, in the data's own name: "Reading `supplier_invoices_fy2026_h1.csv`", "Searching `fct_revenue` for MFL-58821". No ellipsis: the line adds it. Sentence case, no period.
- **`done`:** the same, in the past: "Read …", "Searched …". `summary` counts what ran: "Read 3 files", or "Read 2 of 3 files" when one failed, since a failed call wasn't read.
- **`error`:** what failed, and why if known, in one sentence: "Couldn't read the columns in `bank_export_kjp_2026-09.csv`: it has no header row." Never "Oops" and never "Sorry".
- **`next`:** what happens next, in the agent's "I": "I'll take both payments as the invoice file records them." Or what the person can do: "Re-export it with headers to include it."
- **File and model names** in `--font-mono`, one step smaller (`--text-xs` in this `--text-sm` line, §8.3). The props take nodes for this.
- A line holds a verb and one identifier. It wraps on a narrow panel, with the caret and spinner held to its first line, but anything more belongs in `detail`.

Today the agent only reads (`docs/agent-voice.md`, *Vague and out-of-scope requests*), so every call is a read, a search or a query. An action that changes something asks first, with a `Confirmation`, and shows here once it has run.

## Not here

- No parameters as JSON. Put what the call read in `detail`, in the data's words; pass a `CodeView` there for a query.
- No status badge. A call's words are the activity-line vocabulary (`docs/site.md` D1), not `runStatuses`: "Reading…", "Read". A run's steps belong in `RunLogRow`.
- No retry button. The agent says what it does next; nothing here can re-run a call.
- No shimmer on the running label, for the reason `AgentReasoning` gives.
