# Avatar

Foundational, added 2026-10-07 (approved). Adopted from shadcn/ui (Base UI, `base-mira`) and retokenized.

**Styling on hold (2026-10-27).** A restyle is planned. Until it lands, the fallback is back to shadcn's default type and the stories are shadcn's demo, one letter only: `Default` (with a size control), `Sizes` and `Identity`. `animatedSrc` is unchanged; `AccountMenu` shows it.

```tsx
<Avatar size="sm">
  <AvatarImage src={user.avatar} alt="Mei Tachibana" />
  <AvatarFallback identity={2}>M</AvatarFallback>
</Avatar>
```

## Identity: one letter on a tint

Since 2026-11-13 (owner; `docs/design-system.md` §1 "Identity colour") a person's fallback is **one letter**, the first of their name, on a tinted ground that says who they are. It is the one exception to §0 rule 1.

| Prop | On | Type | Notes |
|---|---|---|---|
| `identity` | `AvatarFallback` | `number` | The person's position in the workspace's member list, from 1. Picks one of four grounds, in §1's order: lake, ochre, teal, ivy. The fifth person starts again at the first, so pass the position as it is. |

- **Leave it out for anything that isn't a known person.** An agent's avatar and the system's stay neutral.
- **Never choose a ground by hashing a name**, and never pick one to mean something: the order carries no meaning.
- **The ground never stands alone.** Two people can share a letter and, after the fourth, a ground. Keep the name beside the avatar or as its accessible name.
- **Ochre is also "waits on you".** A `StatusDot` beside an ochre avatar is the same hue; shape carries the difference. §1 records this as an accepted cost.

`check-contrast.mjs` gates each letter at 4.5:1 on its own tint over every ground. `tests/avatar.spec.ts` holds the four grounds, the repeat, and the neutral fallback.

Kept: `Avatar`, `AvatarImage`, `AvatarFallback`. Dropped: `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount`. Their stacked-avatar separator is a `ring-2`, which is a box-shadow (§4). Restore them from the registry with an outline-based separator if a stacked group is needed.

## Sizes

| Size | px | Use |
|---|---|---|
| `sm` | 24 | In a 28px row or beside a 32px control, such as the sidebar footer |
| `default` | 32 | A menu header or a comment |

In rem (`size-[1.5rem]`, `size-[2rem]`), 24px and 32px at the default text size: an avatar holds a letter, so it grows with it (§7.5, since 2026-11-10; `size-6` and `size-8` until then). There are no avatar size tokens. If a third size or a third component needs one, that's the moment to ask for a token.

## Appearance

- **Shape:** `--radius-full`. §7.7 lists the avatar among the inherently round shapes.
- **Rim:** a 1px `--color-border` rim drawn as an `::after` over the image, blended (`darken` in light mode, `lighten` in dark). It reads as a light rim against any image in both modes without changing the 24/32px footprint.
- **Fallback:** one letter. With `identity`, on that person's tint (`--color-bg-identity-N`, `--color-text-identity-N`). Without it, neutral (`--color-surface-raised`, `--color-text-secondary`). Type is shadcn's as it ships: `--text-sm`, `--text-xs` at `sm`, regular weight, in the case the caller passes.

## Animation: `animatedSrc` and `animate`

```tsx
<AvatarImage src={still} animatedSrc={animated} animate={hovered} alt="Mei Tachibana" />
```

**Still by default.** The animated file plays only while `animate` is true, and **never under `prefers-reduced-motion: reduce`**. That check lives here, so no caller can forget it.

**Playing is a swap, not a pause.** An image in an `<img>` cannot be paused or restarted. So the still `src` always renders, and the animated file is mounted over it only while playing. A fresh mount starts on the first frame; this was verified in Chromium by drawing a remounted `<img>` to a canvas. Each play therefore starts from the beginning, and when the still is the animation's first frame there is no jump.

**Why `<img>` and not inline SVG**, which could be paused: an avatar is user content. An SVG in an `<img>` cannot run script or load anything; inlined into the DOM it can, and would need a sanitizer.

The animated layer is `alt=""` and `aria-hidden`. The still image carries the `alt`, so the accessible name never depends on motion. Pass `alt=""` when the name is already beside the avatar, as in a trigger.

**Fixtures:** `fixtures/avatar-animated.svg` is a 20×20 SMIL pixel avatar on a 4s loop. `fixtures/avatar.svg` is the same file with its `<animate>` elements removed, which leaves exactly the first frame.

## Fallback timing

Base UI shows `AvatarFallback` until the image has loaded, and keeps it if loading fails.
