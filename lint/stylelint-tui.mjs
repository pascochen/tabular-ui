/**
 * Tabular UI design-system Stylelint rules — the CSS half of "the primary design
 * system gate" (tools.md). The ESLint half (utility class strings in
 * components) lives in eslint.config.js.
 *
 * Each message says WHY and cites the spec section, per scaffold Task 6:
 * a lint error that only restates the rule teaches nothing.
 */
import stylelint from 'stylelint';

import { BANNED_SCALES, CHROMATIC_SCALES, STEPS, alternation } from './palette.mjs';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

// Every colour scale and step, Tailwind's and the Riso ramps, from the one shared list (palette.mjs).
const HUE_RE = new RegExp(`\\b(?:${alternation(BANNED_SCALES)})-(?:${alternation(STEPS)})\\b`);
const HEX_RE = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;
const CHROMATIC_DEEP_RE = new RegExp(`\\b(?:${alternation(CHROMATIC_SCALES)})-9(?:00|25|50)\\b`);

const docsUrl = 'docs/design-system.md';

/* Rule 1 (CSS half) — no raw hex, no raw scale names outside theme.css and
   palette.css. File scoping happens in .stylelintrc.json overrides. */
const noRawColorName = 'tui/no-raw-color';
const noRawColorMessages = ruleMessages(noRawColorName, {
  rejected: (value) =>
    `Raw color "${value}" outside theme.css. Raw hues and hex break mode switching and any future hue change, silently. Reach for the semantic layer: --color-text-danger, bg-bg-danger. See ${docsUrl} §9 "Naming" and CLAUDE.md rule 10.`,
});
const noRawColor = (primary) => (root, result) => {
  if (!validateOptions(result, noRawColorName, { actual: primary, possible: [true] })) return;
  root.walkDecls((decl) => {
    const bad = decl.value.match(HUE_RE) ?? decl.value.match(HEX_RE);
    if (bad) {
      report({
        result,
        ruleName: noRawColorName,
        message: noRawColorMessages.rejected(bad[0]),
        node: decl,
        word: bad[0],
      });
    }
  });
};
noRawColor.ruleName = noRawColorName;
noRawColor.messages = noRawColorMessages;
noRawColor.meta = { url: docsUrl };

/* Rule 2 — no chromatic 900/950 step in any background-ish property.
   Applies everywhere INCLUDING theme.css: this guards the token layer
   itself. Neutral (ledger) is exempt — it is the surface ramp. */
const noDeepBgName = 'tui/no-deep-chromatic-background';
const noDeepBgMessages = ruleMessages(noDeepBgName, {
  rejected: (value) =>
    `Chromatic 900/950 step "${value}" as a background. Those steps have hue-dependent lightness drift, so two 950 chips of different hues will not sit at the same visual depth. Use alpha over the canvas instead: {hue}-500/10. See ${docsUrl} §0 rule 3.`,
});
const BG_PROP_RE = /^(?:background(?:-color)?|--tui-(?:bg|fill|surface|canvas)|--color-(?:bg|fill|surface|canvas))/;
const noDeepBg = (primary) => (root, result) => {
  if (!validateOptions(result, noDeepBgName, { actual: primary, possible: [true] })) return;
  root.walkDecls((decl) => {
    if (!BG_PROP_RE.test(decl.prop)) return;
    const bad = decl.value.match(CHROMATIC_DEEP_RE);
    if (bad) {
      report({
        result,
        ruleName: noDeepBgName,
        message: noDeepBgMessages.rejected(bad[0]),
        node: decl,
        word: bad[0],
      });
    }
  });
};
noDeepBg.ruleName = noDeepBgName;
noDeepBg.messages = noDeepBgMessages;
noDeepBg.meta = { url: docsUrl };

/* Rule 4 — dimension caps: spacing ≤ 32px, radius ≤ 8px (9999px = full is
   the one exception), control height ≤ 36px. "The cap is the design" —
   generous spacing is how dense products silently become sparse (§0 rule 5).
   The page frame tier (--pad-frame-*) is the one spacing exception, capped at
   64px: it is paid once per page, not once per row (§7.3 "Frame tier"). It is
   checked BEFORE the spacing pattern, which would otherwise claim it as --pad.
   Heights are enforced on --h-* tokens only: a generic `height:` can
   legitimately exceed 36px (modals, panels); controls must come from --h-*. */
const dimensionCapsName = 'tui/dimension-caps';
const dimensionCapsMessages = ruleMessages(dimensionCapsName, {
  spacing: (px) =>
    `Spacing value ${px}px exceeds the 32px ceiling. Generous spacing is how dense products silently become sparse — the cap is the design. Page-frame air above 32px goes through a --pad-frame-* token in a shell (AppShell, EmptyState, an app's App.tsx), never a raw value. See ${docsUrl} §0 rule 5 and §7.3.`,
  frame: (px) =>
    `Frame spacing ${px}px exceeds the 64px frame ceiling. That covers page gutters and empty-state air; larger hero spacing was deliberately not adopted. See ${docsUrl} §7.3 "Frame tier".`,
  radius: (px) =>
    `Radius ${px}px exceeds the 8px ceiling (9999px "full" is reserved for dots, count badges, avatars). Larger radii read consumer SaaS, the opposite of the intended tone. See ${docsUrl} §7.7.`,
  height: (px) =>
    `Control height ${px}px exceeds the 36px ceiling. No control above 36px, no default table row above 28px. See ${docsUrl} §7.6.`,
  soft: (value) =>
    `Softened corner (${value}). Every rectangle is square since 2026-10-16, and a 2–8px corner reads as a defect, not a choice. Use a tier token, var(--radius-xs…lg), so re-rounding stays a one-line change in theme.css, or var(--radius-full) for a round mark. See ${docsUrl} §7.7.`,
});
const FRAME_PROP_RE = /^--pad-frame-/;
const SPACING_PROP_RE =
  /^(?:padding|margin)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$|^(?:gap|row-gap|column-gap)$|^--(?:pad|gap|spacing)/;
const RADIUS_PROP_RE = /^border(?:-\w+)*-radius$|^--radius/;
const HEIGHT_PROP_RE = /^--h-/;
const PX_RE = /(-?\d*\.?\d+)px\b/g;
// A border-radius declaration's own lengths (the --radius-* tokens are the
// tiers themselves, governed by the cap and the spec). Any non-zero length
// but 9999px, the "full" value, softens a corner (§7.7, since 2026-10-22).
const BORDER_RADIUS_PROP_RE = /^border(?:-\w+)*-radius$/;
const LENGTH_RE = /(?<![\w-])(\d*\.?\d+)(px|rem|em|%)/g;
const dimensionCaps = (primary) => (root, result) => {
  if (!validateOptions(result, dimensionCapsName, { actual: primary, possible: [true] })) return;
  root.walkDecls((decl) => {
    let kind = null;
    if (FRAME_PROP_RE.test(decl.prop)) kind = 'frame';
    else if (SPACING_PROP_RE.test(decl.prop)) kind = 'spacing';
    else if (RADIUS_PROP_RE.test(decl.prop)) kind = 'radius';
    else if (HEIGHT_PROP_RE.test(decl.prop)) kind = 'height';
    if (!kind) return;
    if (BORDER_RADIUS_PROP_RE.test(decl.prop)) {
      for (const match of decl.value.matchAll(LENGTH_RE)) {
        const n = parseFloat(match[1]);
        if (n === 0 || (match[2] === 'px' && n === 9999)) continue;
        report({
          result,
          ruleName: dimensionCapsName,
          message: dimensionCapsMessages.soft(match[0]),
          node: decl,
          word: match[0],
        });
      }
      return;
    }
    const caps = { spacing: 32, frame: 64, radius: 8, height: 36 };
    for (const match of decl.value.matchAll(PX_RE)) {
      const px = Math.abs(parseFloat(match[1]));
      if (kind === 'radius' && px === 9999) continue;
      if (px > caps[kind]) {
        report({
          result,
          ruleName: dimensionCapsName,
          message: dimensionCapsMessages[kind](px),
          node: decl,
          word: match[0],
        });
      }
    }
  });
};
dimensionCaps.ruleName = dimensionCapsName;
dimensionCaps.messages = dimensionCapsMessages;
dimensionCaps.meta = { url: docsUrl };

/* Rule 6 — focus styling must be outline-based, never box-shadow (and never
   Tailwind ring-* via @apply, which compiles to box-shadow). Box-shadow
   rings get clipped by overflow:hidden on scrolling table containers — a
   guaranteed bug in this product. See §4 "Focus ring". */
const focusOutlineName = 'tui/focus-outline-only';
const focusOutlineMessages = ruleMessages(focusOutlineName, {
  rejected: (what) =>
    `${what} inside a :focus rule. Box-shadow focus rings get clipped by overflow:hidden on scrolling table containers — use outline with outline-offset instead. See ${docsUrl} §4 "Focus ring".`,
});
const focusOutline = (primary) => (root, result) => {
  if (!validateOptions(result, focusOutlineName, { actual: primary, possible: [true] })) return;
  root.walkRules((rule) => {
    if (!/:focus(?:-visible|-within)?\b/.test(rule.selector)) return;
    rule.walkDecls(/^box-shadow$/, (decl) => {
      report({
        result,
        ruleName: focusOutlineName,
        message: focusOutlineMessages.rejected('box-shadow'),
        node: decl,
      });
    });
    rule.walkAtRules('apply', (atRule) => {
      if (/(?:^|\s)(?:ring|shadow)/.test(atRule.params)) {
        report({
          result,
          ruleName: focusOutlineName,
          message: focusOutlineMessages.rejected(`@apply ${atRule.params.match(/(?:ring|shadow)\S*/)[0]}`),
          node: atRule,
        });
      }
    });
  });
};
focusOutline.ruleName = focusOutlineName;
focusOutline.messages = focusOutlineMessages;
focusOutline.meta = { url: docsUrl };

export default [
  createPlugin(noRawColorName, noRawColor),
  createPlugin(noDeepBgName, noDeepBg),
  createPlugin(dimensionCapsName, dimensionCaps),
  createPlugin(focusOutlineName, focusOutline),
];
