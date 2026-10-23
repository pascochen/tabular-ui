# ChatStarter

Product. What the chat panel shows before the first message: one line on what can be asked here, and questions to start from.

```tsx
const composer = useRef<ChatComposerHandle>(null);
const [draft, setDraft] = useState('');

<AppShellPanelHeader title="Chat" />
<ChatThread
  turns={turns}
  busy={streaming}
  empty={
    draft === '' ? (
      <ChatStarter
        description="Ask about your models, runs and figures, why a run or test failed, or a file you attach. Nothing here changes your data."
        suggestions={['Why did dim_accounts fail its last run?', 'Which models read order_total?']}
        onSelect={(text) => composer.current?.fill(text)}
      />
    ) : null
  }
/>
<AppShellPanelFooter>
  <ChatComposer ref={composer} value={draft} onValueChange={setDraft} onSend={ask} busy={streaming} onStop={stop} />
</AppShellPanelFooter>
```

## Why this shape

Benchmarked 2026-10-14 against about 30 AI chat screens on Mobbin. Most are full pages: a greeting ("Hi Alex, how can I help you today?") over a centred composer, with chips below. Neither part transfers:

- **The composer stays in the footer.** Send never moves (`ChatComposer`), and §7.3 already declined the reference product's empty-chat hero layout. The products that keep their composer at the bottom (Dropbox Dash, Lightfield, Klaviyo, ClickUp, Fireflies' side panel) put the starter above it, with suggestions as a vertical list. In a 440px panel a list of whole questions reads better than wrapping chips.
- **No greeting.** `docs/agent-voice.md`: the agent is "a colleague reporting to a finance lead, not a host welcoming a guest", and the first word is content.

Placement, click behaviour and where the questions come from were chosen by the owner the same day.

## Props

| Prop | Type | |
|---|---|---|
| `description` | `ReactNode` | Describes what can be asked here, with no agent name (`docs/agent-voice.md`, rule 1). **Promise only what it does today**: this line is how the user learns what to ask, and a promise it can't keep is the first answer that fails. |
| `suggestions` | `string[]` | Questions for the screen the panel sits beside: a run log asks about runs, a model page about that model. Three or four, each a whole question, about 50 characters or fewer. Use the data's own names verbatim. Strings, because the tooltip repeats a truncated one. |
| `onSelect` | `(text) => void` | Called with the picked question. Pass it to `ChatComposerHandle.fill`. |
| `label` | `string` | The list's label. "Suggested". |

## Behaviour

- **A pick fills the composer and never sends.** Finance questions usually need a model, a period or an entity named before they're worth asking. `fill` puts the caret at the end, so the user adds the scope, or presses Enter to send as is.
- **Hide it while there's a draft** (`draft === ''`, as above). `fill` replaces the draft, so a visible list could wipe what the user typed with one click. Clearing the box brings the list back.
- **It goes when the first message is sent**, because `ChatThread` shows `empty` only while `turns` is empty.

## Anatomy

At the bottom of the thread area, one `--pad-page-y` above the composer's footer rule (`ChatThread`'s `empty` slot). `--gap-group` (12px) between the description and the list.

| Part | Treatment |
|---|---|
| Description | `--text-sm`, `--color-text-secondary`: help text is read, so not tertiary (§3). |
| Label | §8.1 micro-label, as `AppShellNavGroup`'s: `--text-2xs`, 500, uppercase, `--tracking-wide`, secondary. `--gap-field` above the rows. |
| Rows | `Button` `outline`, full width, left-aligned, 32px, at regular weight rather than Button's 500: at 500, four rows outweighed the composer (owner's review, 2026-10-14). Outline so a row reads as something to press before it's hovered; its edges line up with the composer's box below. 4px apart (`gap-1`, §7.4 fallback, as Menu's spaced rows). A long question truncates with `TruncatedText`: the full question is in the button's name, and in a tooltip on hover and on keyboard focus (`showOnControlFocus`). |

Four rows with the description: about 200px. In a panel too short for it, the starter scrolls on its own (`ShortPanel`).

Entirely neutral (§0 rule 1 lists empty states). No display icon: `EmptyState`'s 48px glyph is for an absence with nothing to do, and here the next step is the content.

## Not here

- **What happens with a vague or out-of-scope question.** That's the agent's reply, not this component: `docs/agent-voice.md`, *Vague and out-of-scope requests*.
- No categories, tabs or "More" row. Pick the four that fit the screen best.
- No recent chats. There's no chat history yet.
- No usage disclaimer ("AI can make mistakes"). Confidence comes from the agent stating its basis in each answer (`docs/agent-voice.md`, *Uncertainty*), not a footer.
