# FilterChip

Product. Composes `Chip`. A chip that names an applied filter.

```tsx
<FilterChip field="Owner" value="a.kanzaki" dismissLabel="Remove Owner filter" onDismiss={remove} />
```

## The field/value split is the point

"Owner: a.kanzaki" is legible out of context. A bare "a.kanzaki" in a filter bar is a guess — is it the owner, the last editor, the reviewer? The field label costs a few pixels and removes the ambiguity entirely.

The field renders in `--color-text-secondary` and the value in the chip's own colour, so the pair reads as one unit with the value dominant. The field name is what makes the chip legible out of context, so it is text the user must read: tertiary measured under AA here (§3, decided 2026-10-08).

## Neutral, even when filtering for a state

A filter is not state (§0 rule 1). A chip filtering for failed runs still carries **no hue**, because the chip is not itself failing — it is naming a query. Tinting it red would make a hue mean "this filter mentions a state" rather than "this *is* the state", which is the erosion rule 1 exists to prevent.

Selection is the one exception and uses the interactive role, because selection *is* interactive (§4).

## Inherited from `Chip`

Border and hover carry interactivity, not radius (§7.7). The dismiss X is its own button, a sibling of the chip's rather than nested in it, and requires `dismissLabel` for its accessible name. See `Chip`'s README.
