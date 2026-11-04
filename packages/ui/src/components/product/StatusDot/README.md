# StatusDot

Product. §7.7's status dot: 6px, no text.

```tsx
<StatusDot status="needs-review" />
<StatusDot status="open" />
```

## Why this exists

A sidebar row has no room for a `StatusBadge`. §5 decides what a dot means there, and this component holds that in one place, so a screen can't draw its own.

| Status | Dot | Means |
|---|---|---|
| `needs-review` | Solid, `--color-fill-warning` | Something here is waiting on the person looking at it |
| `open` | Hollow, a `--border-width` ring in `--color-text-secondary` | Something here is unsettled, and isn't waiting on them |

Only these two have a dot. A `queued` item doesn't take one: nobody here can settle it. If a place holds both, it takes `needs-review`.

## Shape carries the difference

A solid neutral dot beside the ochre one differed by colour alone, against §11.1, and it read first, because ochre has the lower contrast in both modes. A ring has about 55% of a solid dot's area, so the ochre dot reads first, and in grayscale it's the only solid one. See §5.

## Always say it in text as well

The dot is `aria-hidden`, whatever you pass. Put its meaning beside it as hidden text:

```tsx
<AppShellNavItem trailing={<StatusDot status="needs-review" />}>
  revenue
  <span className="sr-only">, needs your answer</span>
</AppShellNavItem>
```

## Forced colours

Forced colours replace backgrounds and keep borders. The ring needs nothing, and the solid dot takes the system's `CanvasText`, or it would disappear while the ring stayed. `tests/status-dot.spec.ts` reads the painted pixels.

## Known risks

The ring is the system's only hollow status mark, and it could read as "empty" or "done with". It has only been checked on a 2x display. §5 records both as accepted, and neither has been tested with users.
