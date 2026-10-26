# AgentBlock

Product. **A category of one, on purpose.**

```tsx
<AgentBlock authorship="AI · Awaiting review" meta="proposed 14:22" actions={<><Button size="sm" variant="ghost">Don't add it</Button><Button size="sm">Add dedupe step</Button></>}>
  {proposal}
</AgentBlock>
```

## Never a generic Card

`CLAUDE.md` is explicit: do not build agent output as a generic card. Agent-authored versus human-verified is the most important distinction in this product — §1 calls it the entire trust story — and the authorship signal disappears silently the moment someone reaches for the wrong primitive. That is why this component exists rather than a `Card` with a prop.

## Two signals, mandatory together

§5 specifies both, and neither is optional:

1. a 2px left rail in solid `--color-text-agent` (§7.8 reserves 2px for exactly three things; this is one). Not the `--color-border-agent` tint: with no violet ground behind it, the tint measured 1.3:1 against the surface in both modes, under the 3:1 a required graphical signal needs (WCAG 1.4.11). Solid, it measures 6.96:1 on the dark surface and 7.13:1 in light mode (§5, measured on the Riso Ledger palette).
2. an explicit written label in `--color-text-agent`: `authorship` is a **required prop**

The block itself is neutral: a 1px `--color-border` box with no ground of its own, so it takes the surface it sits on.

Colour is deliberately not carrying this alone. The rail and the label each say "agent" independently, so authorship survives grayscale, deuteranopia and print — §5's own requirement, verified in the Grayscale story.

**Changed 2026-10-14 (owner's decision).** It had four signals: the rail, a violet tint ground, a 12px violet robot icon and the label. Once emerald became the accent, a violet field behind every agent turn read as decoration rather than a signal, and the chat panel looked mostly purple. Making the block emerald was considered and rejected: §1 already rules out reusing the interactive hue for the agent, since focus rings, success and primary actions would all read as agent activity. So the hue stays and its area shrinks to the rail and the label. The icon added nothing the label didn't already say. The `icon` prop went with it; nothing passed one.

## Discipline

**Orchid marks authorship and agent activity only** (§1). It never means "good", "new" or "important". If orchid starts appearing on things the agent did not produce, the system has failed — and the failure is silent, because nothing breaks.

## Resolved: yellow corner pixels in light mode on a white surface

Until 2026-10-14, Chromium drew about 31 yellow pixels at an AgentBlock's rounded corners in light mode on `--color-surface` (`#fff`). `violet-500` is outside sRGB, and where the antialiased corner blended its 20% border and 8% ground over white, the blue channel wrapped to 0 instead of clamping. It needed the oklab-alpha border, the oklab-alpha ground and the radius together. The neutral block has no violet ground and a neutral border, so the case no longer exists. The rail is still a violet tint; if a corner artefact reappears there, the root fix is still gamut-mapping the violet tints in the token layer (§4, §9), with the side-by-side the spec asks for.
