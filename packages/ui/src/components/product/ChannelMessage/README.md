# ChannelMessage

Product. Composes `Avatar`, `Button` and `AgentBlock`. Added 2026-10-29, for the Kasane close demo.

One member's message in a channel of several people, with its replies inline beneath it.

```tsx
<ChannelMessageList>
  <ChannelMessage author={{ name: 'Close agent', avatar: <Avatar>…</Avatar> }} time="09:04" authorship="AI · Catch-up">
    6 exceptions found since September was locked. 2 are resolved.
  </ChannelMessage>
  <ChannelMessage
    author={{ name: 'Daisuke Onodera', avatar: <Avatar><AvatarFallback>DO</AvatarFallback></Avatar> }}
    time="13:48"
    dateTime="2026-10-16T13:48"
    replies={[<ChannelMessageReply key="1" author={mei} time="13:52">Agreed.</ChannelMessageReply>]}
  >
    Logistics confirms it left Tsukuba on 1 Oct.
  </ChannelMessage>
</ChannelMessageList>
```

## Not `ChatThread`

`ChatThread` is a conversation between one user and one assistant: the user's turns sit on the right with no name, and the assistant's are `AgentBlock`s. A channel has several people and the agent among them, so every message names its author and time, and nobody's is set apart by position.

## Parts

| Part | Renders | Notes |
|---|---|---|
| `ChannelMessageList` | `<ol role="list">` | The channel. Messages `--gap-group` (12px) apart |
| `ChannelMessage` | `<li>` | Avatar, header (name, badge, time), body, then the replies |
| `ChannelMessageReply` | `<li>` | Inside `replies`. 24px avatar, `--text-sm` name. Takes no replies: one level |

## Props

| Prop | Type | Notes |
|---|---|---|
| `author.name` | `string` | |
| `author.avatar` | `Avatar` | The message sets its size and `aria-hidden` (below) |
| `author.badge` | node | A `Badge` after the name, for a member who isn't a person: "System" for a deterministic check |
| `time` | `string` | As shown: "14:02". Rendered in a `<time>` with `tabular-nums` |
| `dateTime` | `string` | The `<time>`'s machine-readable value |
| `authorship` | `string` | The agent wrote this message. The body renders inside an `AgentBlock` with this label |
| `agentActions` | node | Controls in that `AgentBlock`'s header |
| `replies` | `ChannelMessageReply[]` | Inline beneath the message, behind a disclosure |
| `repliesOpen` / `defaultRepliesOpen` / `onRepliesOpenChange` | | Controlled or uncontrolled. Closed by default |

## Decisions

| Decision | Why |
|---|---|
| **An agent's body is always an `AgentBlock`** | `CLAUDE.md`: agent-authored content never renders as a generic box. With `authorship` set, the component draws the block itself, so a caller can't put agent text beside a person's with no rail or label |
| No badge on an agent's message | Its block's label already says "AI". A badge would say it twice, a line apart |
| `badge` is for other non-people, and neutral | "System" is context, not a state (§0 rule 1). Orchid is the agent's alone (§1) |
| The avatar is `aria-hidden` | The name is beside it. With the initials exposed, a message is read "DO Daisuke Onodera" |
| The header is as tall as the avatar (32px; 24px in a reply) | The name sits level with the avatar's centre, and the body starts under both. `min-h`, so a long name wraps instead of overlapping. Primitive steps, the avatar's own: `Avatar` has no size tokens |
| Name `--text-base` 600, time `--text-xs` secondary | The body's size, one weight up, so the author leads. The time is read, so secondary, never tertiary (§3). In a reply the name drops to `--text-sm` with the 24px avatar |
| Replies fold behind `Button variant="inline"` | `AgentReasoning`'s disclosure, with its recipe unchanged, so the two read as one control. `aria-expanded`, and `aria-controls` once the replies exist. The count stays the label, open or closed |
| Replies render only when open | As `AgentReasoning` and `RunLogRow`. Nothing hidden sits in the tab order |
| A 1px `--color-border` rule left of the replies | It marks the thread as structure, so it is neutral |
| One level of replies | A thread of a thread is where a channel stops being readable. `ChannelMessageReply` has no `replies` prop, so it can't be nested |
| Body `break-words` | A file name or address with no break opportunity would otherwise widen the column past the panel |
| Messages are list items | A screen reader announces "list, 6 items". Not `role="feed"`: that is a composite role with a keyboard pattern this doesn't implement (failure log, `LineageTree`) |

## Announcing new messages

The component announces nothing itself. A channel that grows while someone reads it should say so through a live region the app owns (`announcement.ts`'s pattern), one line per message, so a burst of replies doesn't read the whole thread again.

## Testing

Stories: `Default`, `AgentMessage` (the `AgentBlock` is there), `WithReplies` (the disclosure's states and its `aria-controls`), `ThreadWithAgentReply`, `SystemMember`, `Narrow` (440px; nothing widens the column) and `Channel` (folded replies aren't messages of the channel's list). Every story runs in both modes with axe.
