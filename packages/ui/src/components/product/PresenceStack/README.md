# PresenceStack

Product. Composes `Avatar` and `Badge`. Added 2026-10-29, for the Kasane close demo.

Who is here, as overlapping avatars: the first few drawn, the rest folded into a "+N" count.

```tsx
<PresenceStack
  members={[{ id: 'E0010', name: 'Daisuke Onodera', avatar: <Avatar><AvatarFallback>DO</AvatarFallback></Avatar> }, …]}
  max={3}
  label="In sep-close"
/>
```

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `members` | `PresenceMember[]` | — | `id`, `name` and an `Avatar` each. The stack sets the avatar's size (24px) and `aria-hidden` |
| `max` | `number` | `3` | Avatars drawn. The rest fold into "+N" |
| `label` | `string` | `"Here now"` | Names the list for assistive technology |
| `ground` | `'canvas' \| 'surface' \| 'raised'` | `'canvas'` | The ground the stack sits on, whose colour draws the gap between avatars |

## Decisions

| Decision | Why |
|---|---|
| The gap is a 2px outline in the ground's colour | `Avatar`'s group part was dropped because shadcn drew it with a `ring-2`, a box-shadow (§4). An outline sits outside the 24px box, so the footprint is unchanged and the overlap reads as a cut-out. It can't know the ground, so `ground` says it |
| 4px of overlap | With the 2px gap, 6px of each avatar is covered. Initials sit about 5px in from the edge: at 6px of overlap, 8px covered, "DO" read as "DC" |
| 24px only | `Avatar`'s `sm`, the size beside a 32px control in a header band. A larger stack would be the first case for avatar size tokens, which `Avatar`'s README says to ask for |
| No hue, no presence dot | Being here is who someone is, not a state of the data (§0 rule 1). A dot in the success hue would read as "passed" |
| A named list; avatars hidden, names as visually hidden text | A screen reader hears "Here now, list, 5 items" and every name, the folded ones included. The "+N" badge is `aria-hidden`: the items already count them |
| No tooltip with the names | Base UI's tooltip is visual only (`Tooltip` README), and the names are already read. If sighted users need them, the next step is a `Popover` behind a button, not a tooltip |

## Testing

`Default` checks the list's name and items, and that avatars are hidden. `Overflow` checks five items with three drawn, the "+2" count, the 4px overlap, and the gap's colour against the canvas. `OnSurface` shows the gap on a surface, and `One` a single member. Every story runs in both modes with axe.
