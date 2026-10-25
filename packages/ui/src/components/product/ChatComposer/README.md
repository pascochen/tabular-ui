# ChatComposer

Product. The message box in the chat panel's footer, below `ChatThread`.

```tsx
<AppShellPanelHeader title="Chat" />
<ChatThread turns={turns} busy={streaming} />
<AppShellPanelFooter>
  <ChatComposer onSend={ask} busy={streaming} onStop={stop} />
</AppShellPanelFooter>
```

## Why two rows, with Send inside

The first version put a one-line field and a Send button side by side, copied from the shell's placeholder sketch. A benchmark against four chat composers (ChatGPT, Claude, shadcn's chat panel and one more) found every one puts Send **inside** the message box, at the bottom right. They split on one row versus two. Two rows was chosen on 2026-10-13: shadcn's panel is closest to ours in width and purpose, attachments are coming (`AttachmentRow`), and Send never moves as the text grows. The cost: the panel footer is taller than the sidebar's, so the two bottom rows no longer line up (`AppShell` README).

## Props

| Prop | Type | |
|---|---|---|
| `onSend` | `(text: string) => void` | Called with the trimmed text. The field then clears and keeps focus. With attachments the text may be empty: the files are the message. The caller owns `attachments`, so it clears them here. |
| `busy` | `boolean` | A turn is streaming. Typing still works, so the user can draft the next question, but nothing sends. Pass the same value as `ChatThread`'s `busy`. |
| `onStop` | `() => void` | While `busy`, Send becomes Stop. **Pass it**: a streaming answer the user can't stop is a dead end (AI principle: let people stay in control). Without it, Send stays, disabled. |
| `actions` | `ReactNode` | Leading controls in the bottom row, after the attach button and left of Send: a context picker. `IconButton`s, ghost, default size. |
| `onAttach` | `(files: File[]) => void` | Shows the attach button (paperclip, `IconButton` ghost), first in the bottom row, and is called with the files picked. Add them to `attachments`. The picker only *suggests* `accept`: a user can still choose "All files", so check each type here. |
| `accept` | `string` | What the picker offers. Default `.md,.csv,.xlsx,.xls,.txt`, what the agent reads (owner, 2026-10-15). |
| `attachments` | `ChatAttachment[]` | `{ id, name, size?, status?, progress? }`. Listed in the box above the message. While any is `queued`, `running` or `failed`, nothing sends: a message must not go out referring to a file the agent doesn't have. **Once a file has uploaded, drop its `status`.** `passed` beside a file in the message box reads as a validation result, and every attached file would carry a green badge (§0 rule 1: a hue only when something is true that the user needs to know). |
| `onRemoveAttachment` | `(id) => void` | Gives each file a remove button, named "Remove <file name>". Focus returns to the field. |
| `disabled` | `boolean` | No typing, no sending. The whole box fades to 50%, once: its buttons cancel their own fade, as the field does, or they would sit at 25%. |
| `value`, `onValueChange` | `string`, `(value) => void` | Controlled text, for a caller that restores drafts or inserts text. Omit both and the composer holds it. |
| `label` | `string` | Accessible name. "Message". |
| `placeholder` | `string` | "Ask about models, runs or figures": what can be asked, with no agent name (`docs/agent-voice.md`, rule 1). |
| `maxRows` | `number` | Lines before the text scrolls. 6. |
| `ref` | `Ref<ChatComposerHandle>` | `fill(text)` replaces the draft and puts the caret at the end, for a suggestion the user picked (`ChatStarter`); it never sends. Works controlled or not. `focus()` focuses the field. |

## Keys

- **Enter** sends. **Shift+Enter** starts a new line.
- **Enter while an IME is composing** (Japanese, Chinese, Korean input) confirms the composition and never sends. Without that check, the first Enter that picks a character would send half a sentence. Two checks, because Safari fires that Enter after `compositionend`, with `isComposing` already false: there only `keyCode` 229 says an IME handled it (`apps/storybook/tests/chat-panel.spec.ts`).
- Blank or whitespace-only text never sends, and Send is disabled until there is something to send.

## Anatomy

One `<form>` box, two rows, `--gap-field` (8px) between them.

| Part | Treatment |
|---|---|
| Box | 1px `--color-border` on a transparent ground, as `Input` (§0 rule 7). `--radius-lg` (0px since 2026-10-16), `--pad-card` (12px). It draws the focus ring for the field inside: outline on `has-[textarea:focus-visible]`, never box-shadow (§4). Pressing its padding or the empty stretch of the bottom row puts the caret in the field. |
| Message | `Textarea` `variant="borderless"`, `minRows={1}`: 20px empty, growing a line at a time to `maxRows`, then scrolling. Hidden lines fade at the edge they hide behind (§4 *Scroll cue*). |
| Attached files | Above the message, inside the box: one `AttachmentRow` per file (28px, neutral file-type glyph, name in mono, size, upload status or progress, remove). The list is pulled out by the rows' own `--pad-cell-x`, so each glyph lines up with the message text and the hover fill reaches into the box's padding. Added 2026-10-15 after a benchmark: Dropbox Dash, Langdock and ChatGPT all show attached files inside the box, above the text. |
| Bottom row | The attach button (with `onAttach`), then `actions`, then Send or Stop at the right. |
| Send | `IconButton` `default` (the interactive fill, the panel's one primary action), 32px, `ArrowUp`: the arrow points into the thread. Named "Send message", which is also its tooltip. `--radius-md`, as every control: square since 2026-10-16, like the box. It took 6px first, on 2026-10-13, as an exception to sit closer to the box's then 8px corner; on 2026-10-15 all controls moved to 6px (§7.7), so the exception is gone. |
| Stop | `IconButton` `outline`, `Stop`, in the same slot. Named "Stop responding": a bare "Stop" doesn't say what stops. Neutral: stopping a turn is not a danger. |

Empty, the box is 86px (12 + 20 + 8 + 32 + 12, plus the borders), and the footer around it 110px. At six lines it's 186px. The thread above gives up the height, since `ChatThread` is the flex child that shrinks.

After Send or Stop, focus goes back to the field. Send disables itself once the field empties, and Stop unmounts when the turn ends. A focused button that becomes disabled or disappears drops focus to the page.

## Not here

- No drag-and-drop or paste. The button covers every user; a drop target is a convenience, and drop-only would fail WCAG. If it's added, the depth-counting `dragenter`/`dragleave` handling ships with tests (`AttachmentRow` README).
- No type check of its own: `accept` is a hint to the picker, and the caller rejects what the agent can't read.
- The file input is the browser's, hidden with `aria-hidden` and `tabIndex={-1}`, so the paperclip is the only control a screen reader or the Tab key meets (failure log, `AttachmentRow`'s `UploadTarget`).
- No model or context picker under the box (Claude puts one there). Add it when there's a setting to pick.
- No visible keyboard hint. Enter-to-send is the convention in every chat surface the people using this already know.
- No draft persistence. Use `value` and `onValueChange` to keep a draft.
