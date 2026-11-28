# AgentCard

Product. One agent as an object: its glyph, its name, the rule it checks, and what it found.

```tsx
<AgentCard
  icon={TrendUpIcon}
  name="Revenue AI"
  href="/agents/revenue"
  rule="Revenue lands in the month of delivery."
  meta="Reads 3 files"
>
  <AgentCardFinding
    title="Revenue booked early"
    href="/findings/revenue-cut-off"
    status={<StatusBadge status="needs-review">Needs your answer</StatusBadge>}
  />
</AgentCard>
```

## Why this exists

A page of agents was a ruled list of text, and people think of agents as separate things. A card gives each one an edge and a mark to find it by. Added 2026-11-18, for the Kasane demo's All agents page.

## Neutral, tile included

Other products colour each agent's tile. This one can't: colour means state (§0 rule 1), and an agent is no person, so it takes no identity ground (§1 "Identity colour"). The tile is a 36px box, the density ceiling (§0 rule 5, held by lint), with a 1px `--color-border` edge and the agent's Phosphor glyph at `--size-icon-lg`, `regular`, beside a 500 name (§11.2). Use the glyph the agent's avatar and sidebar row draw, so the mark is the same everywhere.

It takes no orchid and no rail either. Those are `AgentBlock`'s, and they mean the agent wrote what is inside. A card about an agent is not written by it.

## The finding is where the hue is

`children` is a ruled footer for what the agent found: one row per finding, its title and a `StatusBadge`. That status is the only hue on the card, and it is what tells four neutral cards apart at a glance. Leave `children` out for an agent that has raised nothing, and the footer and its rule are not drawn. Don't put a placeholder there: a status that states nothing is a guess.

`AgentCardFinding` is that row: a `ghost` button's shape on a real `<a>`, the width of the card, the title at one end and `status` at the other. The title truncates before the status does, and a cut title can still be read: it shows whole in a tooltip on hover and on the link's keyboard focus (`TruncatedText`, since 2026-11-27). A tooltip never opens on touch, so the tap opens the finding, and **where the row leads must show the title whole**. Until then, on a 375px phone, "List INV-KJP-2609-00363 for the auditors?" kept 170 of its 267px with no way to read the rest. The `LongTitles` story, and `apps/storybook/tests/agent-card.spec.ts`. Its padding is `--pad-card` less the link's own 1px border, so the title starts where the tile does. `href` sets where it opens, and `render` swaps in a router link or an `<a>` with its own `onClick`.

## The name is the link

The card is not wholly clickable, for `AttachmentRow`'s reasons: a stretched overlay stops text being selected, and the card holds a second link, to the finding. `href` makes the name an `<a>`, and `render` swaps in a router link. Without either the name is text.

## Props

| Prop | Type | |
|---|---|---|
| `icon` | Phosphor `Icon` | Required. The agent's glyph. |
| `name` | `string` | Required. |
| `href` / `render` | `string` / element | Makes the name a link. |
| `rule` | node | Required. What the agent checks, as one sentence. It wraps. |
| `meta` | node | One quiet line, `tabular-nums`: "Reads 3 files". |
| `children` | node | `AgentCardFinding` rows, under a rule. |

## Layout

The card fills its container and has no width of its own. In a grid, give the `<li>` `flex` and the card `flex-1`, so cards in a row share a height and their footers line up. Measured in the In a grid story: 12px `--pad-card`, a 36px tile, and a 32px finding row, 111px in all for a one-line rule with `meta` (1px borders and the footer's rule included).
