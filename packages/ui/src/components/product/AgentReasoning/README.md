# AgentReasoning

Product. The agent's "thinking", collapsed behind a one-line summary.

```tsx
<AgentBlock authorship="AI" meta="14:22">
  <AgentReasoning status="done" durationSeconds={4} text={reasoning} />
</AgentBlock>
```

## A part of an `AgentBlock`, not a block of its own

It draws no rail and no authorship label. The `AgentBlock` around it carries both §5 signals. Nesting a second `AgentBlock` would double the rail and put two labels on one turn. Used anywhere else, wrap it in an `AgentBlock`; never in a generic card.

## States

| `status` | Summary line | Announced | Spinner |
|---|---|---|---|
| `streaming` | Thinking…, then Thinking · 0:07 after 3s | Thinking | `Spinner`; stands still under reduced motion, while the figure keeps counting |
| `done` | Thought for 4s (`durationSeconds`), or Reasoning when no duration is given | Thought for 4s, or Finished thinking | none |

`durationSeconds` comes from the caller. The component does not time the finished label. A reopened thread knows the real figure, and a self-timed label differs on every load.

While streaming, the label carries §11.5's elapsed figure, which is live by nature. Pass `startedAt` (epoch ms) when the caller knows when thinking began, so a reload carries on rather than restarting; without it, the figure counts from mount. The figure is `aria-hidden`: the button's name stays "Thinking", and a screen reader never hears it tick.

## It never opens or closes by itself

Collapsed by default, streaming or not. Only the reader toggles it. AI Elements' Reasoning opens when streaming starts and closes a second after it ends. That grows, then shrinks, the block above whatever the reader is looking at, and the plan below jumps. `MessageScroller` is built on "never move the reader against their intent", so this follows it. To show the reasoning open, pass `defaultOpen` or control `open`.

## Anatomy

- **Trigger:** `Button variant="inline"` with `aria-expanded` and `aria-controls`. There is no collapsible primitive, and this needs no more than a toggle (the same pattern `RunLogRow` uses). `--text-sm`, `--color-text-secondary`, weight 500: one step stronger than the body it opens, so it reads as the control. Caret and spinner are 1em and `bold`, set by `Button`. Pointer cursor, and the hover fill `inline` normally hides: nothing around it owns hover. The fill is padded 6px × 2px (`px-1.5 py-0.5`), cancelled by an equal negative margin, so the caret and label do not move. Primitive steps on purpose: no role token covers this, and §7.4's fallback rule says to use the primitive scale rather than borrow one. The label is `tabular-nums`, since the duration is a figure.
- **Status:** a visually hidden `role="status"` beside the trigger, not inside it, where it would join the button's name. It says "Thinking" when streaming starts and the finished summary when it ends, so a screen reader hears the change, then empties after 7 seconds. Left in place, it repeated the button's label to anyone reading the transcript, "Thought for 2s, Thought for 2s". A turn that mounts already done, as a reopened thread's do, announces nothing. The reasoning text is never announced.
- **Content:** rendered only when open. `--text-sm`, secondary, line breaks in strings kept. A hanging indent of 1em plus `--gap-control-icon`, the caret's width and the button's gap, so the text starts under the label. No rule on its left: the `AgentBlock`'s rail already draws a line beside it.

## Copy

Follows `docs/agent-voice.md`: "Thinking…" and "Thought for 4s" are its in-progress and finished status forms. The reasoning text itself is the agent's, and the voice rules govern it.

## Not here

- No markdown rendering. `text` is a string or a node: pass a node to set model and column names in `--font-mono`, one step smaller (§8.3, `--text-xs` beside this `--text-sm` text).
- No shimmer on "Thinking…". AI Elements' shimmer needs `motion`, a new dependency; the spinner already carries the state.
