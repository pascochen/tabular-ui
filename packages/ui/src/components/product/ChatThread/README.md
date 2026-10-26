# ChatThread

Product. The conversation in the chat panel: user turns and assistant turns in a `MessageScroller`.

```tsx
<AppShellPanelHeader title="Chat" />
<ChatThread turns={turns} busy={streaming} />
<AppShellPanelFooter>
  <ChatComposer onSend={ask} busy={streaming} />
</AppShellPanelFooter>
```

## Plain props

It knows nothing about where turns come from: no AI SDK, no `useChat`, no runtime. Pass the turns as they stand and re-render as they change. Streaming is the caller updating `reasoning.status`, `plan.steps` and `plan.status`.

| Prop | Type | |
|---|---|---|
| `turns` | `ChatTurn[]` | Oldest first. `{ id, role: 'user', text?, attachments? }` or `{ id, role: 'assistant', authorship?, meta?, reasoning?, text?, plan? }`. `id` must be stable: the scroller anchors and restores by it. Every `text` is a string or a node: agent text should set model and column names in `--font-mono` (§8.3). The stories leave user turns as typed. |
| `busy` | `boolean` | Sets `aria-busy` on the log while a turn streams, so a screen reader announces the finished turn rather than every step. |
| `label` | `string` | The scroll region's name. "Messages". |
| `empty` | `ReactNode` | Shown instead of the thread while `turns` is empty: a `ChatStarter`. It sits at the bottom, against the composer, with the thread's insets, outside the `role="log"` transcript (suggestions aren't a message), and scrolls on its own in a short panel. |

## In the shell: instead of `AppShellPanelBody`

Place it between `AppShellPanelHeader` and `AppShellPanelFooter`, not inside `AppShellPanelBody`. The body is a scroll container, and a scroller inside a scroller gives two scrollbars and breaks anchoring. ChatThread carries the body's insets (`--pad-page-x`, `--pad-page-y`) inside its viewport, so the scrollbar sits at the panel's edge and the first turn opens one `--pad-page-y` below the header rule, like the other shell columns.

## Turns

- **User:** neutral, right-aligned, `--color-canvas` ground, `--radius-md`, `--pad-card`, at most 85% wide. Files sent with the question (`attachments`) list above it as `AttachmentRow`s, so the thread records what the agent was given; `text` may be empty when the files are the message. No hue (§0 rule 1). A visually hidden "You:" names the speaker for a screen reader, which hears the assistant's turn named by its label.
- **Waiting:** an assistant turn with no `reasoning`, `text` or `plan` yet shows "Working…" with a `Spinner`, in the `--text-sm` secondary style of AgentReasoning's "Thinking…" row. Add the turn as soon as the question is sent. The block the answer will fill is then already on screen, so the answer grows in place instead of a block appearing later and pushing the thread. The label follows §5's "AI working" and says what is happening. "Typing" would pretend the agent is a person. Decided 2026-10-12: a model's first output often takes seconds, and an empty thread in that gap reads as nothing happening. After 3 seconds the label becomes "Working · 0:07" (§11.5): pass the turn's `startedAt` when you know it. The figure is `aria-hidden`, so the log never reads it out.
- **Assistant:** one `AgentBlock` per turn (label "AI" unless `authorship` says otherwise), holding `AgentReasoning`, then `text`, then `AgentPlan`, `--gap-group` apart. One block per turn: the parts draw no rail of their own.

## Scrolling

From `MessageScroller`, with `autoScroll` and `defaultScrollPosition="last-anchor"`:

- User turns anchor. A new question lands near the top of the panel, with 64px of the previous turn above it, and the answer grows below.
- While the reader is at the bottom, streaming follows. Scroll away and it stops. "Scroll to latest" brings them back.
- A saved thread opens at its last question, not the absolute bottom.

## Stories

- `ScriptedConversation`: the revenue-model conversation, played over about six seconds by a timer in the story. Replay runs it again. **Under reduced motion, and in any automated browser (`navigator.webdriver`), it shows the finished state at once.** That keeps the exact-match screenshots and the story tests on one stable frame. The cost: automated runs never exercise the timer.
- `PlanStreaming`: frozen with two steps in and the third drafting.
- `AwaitingResponse`: frozen after the question is sent, before anything comes back.
- `LongThread`: two earlier exchanges above, opening at the last question.

## Copy

Follows `docs/agent-voice.md`. The default authorship label is "AI", the agent's role (decided 2026-10-19), and "Working…" is the in-progress status form.

## Not here

- No composer. It's `ChatComposer`, in the panel footer. Pass both the same `busy`.
- No empty state of its own. Pass a `ChatStarter` in `empty`.
- No markdown parsing (the caller passes nodes), no attachments, no per-turn actions (copy, retry).
