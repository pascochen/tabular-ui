// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

import { BANNED_SCALES, STEPS, alternation } from './lint/palette.mjs';

// Every colour scale, Tailwind's and the Riso ramps, from the one shared list (lint/palette.mjs).
const SCALES = alternation(BANNED_SCALES);
const SCALE_STEPS = alternation(STEPS);

// The design-system gate, shared by every block below. Kept as a constant
// because ESLint replaces a rule's whole option list per config block: a
// block that re-declares no-restricted-syntax for some files must restate
// every other selector, or those files silently lose the rest of the gate.
const designGate = [
  {
    selector: `Literal[value=/\\b(${SCALES})-(${SCALE_STEPS})\\b/]`,
    message:
      'Raw colour scale name (a Tailwind scale or a Riso ramp such as sage-700) in component code breaks mode switching and any future hue change, silently. Use the semantic token utilities (text-text-danger, bg-bg-danger, border-border-agent). Ramp names are legal only in src/styles/theme.css and the generated palette.css. See docs/design-system.md §9 "Naming" and CLAUDE.md rule 10.',
  },
  {
    selector: `TemplateElement[value.raw=/\\b(${SCALES})-(${SCALE_STEPS})\\b/]`,
    message:
      'Raw colour scale name (a Tailwind scale or a Riso ramp such as sage-700) in component code breaks mode switching and any future hue change, silently. Use the semantic token utilities (text-text-danger, bg-bg-danger, border-border-agent). Ramp names are legal only in src/styles/theme.css and the generated palette.css. See docs/design-system.md §9 "Naming" and CLAUDE.md rule 10.',
  },
  {
    selector: 'Literal[value=/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
    message:
      'Raw hex color in component code bypasses the token layer entirely — it cannot mode-switch and its contrast was never measured. Use the --color-* semantic tokens. See docs/design-system.md §9 and CLAUDE.md rule 10.',
  },
  {
    selector: 'TemplateElement[value.raw=/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
    message:
      'Raw hex color in component code bypasses the token layer entirely — it cannot mode-switch and its contrast was never measured. Use the --color-* semantic tokens. See docs/design-system.md §9 and CLAUDE.md rule 10.',
  },
  {
    selector: 'Literal[value=/\\bfont-(bold|extrabold|black)\\b/]',
    message:
      'Font weight above 600: at 13px on a dark canvas, bold weights bloom and reduce legibility rather than increasing emphasis. The scale caps at font-semibold. See docs/design-system.md §8.5.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\bfont-(bold|extrabold|black)\\b/]',
    message:
      'Font weight above 600: at 13px on a dark canvas, bold weights bloom and reduce legibility rather than increasing emphasis. The scale caps at font-semibold. See docs/design-system.md §8.5.',
  },
  {
    selector:
      'Literal[value=/\\b(p|px|py|ps|pe|pt|pb|pl|pr|m|mx|my|ms|me|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(9|[1-9][0-9])\\b/]',
    message:
      "Spacing utility above the 32px ceiling (multiplier 9+). Generous spacing is how dense products silently become sparse — the cap is the design. Page-frame air above 32px goes through a --pad-frame-* token in a shell (AppShell, EmptyState, an app's App.tsx), never a utility multiplier. See docs/design-system.md §0 rule 5 and §7.3.",
  },
  {
    selector:
      'TemplateElement[value.raw=/\\b(p|px|py|ps|pe|pt|pb|pl|pr|m|mx|my|ms|me|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(9|[1-9][0-9])\\b/]',
    message:
      "Spacing utility above the 32px ceiling (multiplier 9+). Generous spacing is how dense products silently become sparse — the cap is the design. Page-frame air above 32px goes through a --pad-frame-* token in a shell (AppShell, EmptyState, an app's App.tsx), never a utility multiplier. See docs/design-system.md §0 rule 5 and §7.3.",
  },
  {
    selector: 'Literal[value=/\\b(h|size)-(10|1[1-9]|[2-9][0-9])\\b/]',
    message:
      'Height utility above the 36px control ceiling (h-9 = 36px is the cap). Controls take --h-control (32px) or --h-control-lg (36px); rows take --h-row-*. See docs/design-system.md §7.6.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\b(h|size)-(10|1[1-9]|[2-9][0-9])\\b/]',
    message:
      'Height utility above the 36px control ceiling (h-9 = 36px is the cap). Controls take --h-control (32px) or --h-control-lg (36px); rows take --h-row-*. See docs/design-system.md §7.6.',
  },
  {
    selector: 'Literal[value=/\\brounded(-(ss|se|ee|es|tl|tr|br|bl|s|e|t|r|b|l))?-(xl|2xl|3xl|4xl)\\b/]',
    message:
      'Radius above the 8px ceiling (rounded-lg = 8px is the cap). Larger radii read consumer SaaS — the opposite of the intended tone. See docs/design-system.md §7.7.',
  },
  {
    selector: 'TemplateElement[value.raw=/\\brounded(-(ss|se|ee|es|tl|tr|br|bl|s|e|t|r|b|l))?-(xl|2xl|3xl|4xl)\\b/]',
    message:
      'Radius above the 8px ceiling (rounded-lg = 8px is the cap). Larger radii read consumer SaaS — the opposite of the intended tone. See docs/design-system.md §7.7.',
  },
  {
    // Heuristic. Catches metric-tier text whose class string lacks
    // tabular-nums; it cannot see numbers rendered without the metric
    // classes, and it matches ONE STRING LITERAL at a time — so a metric
    // class split across a ternary from its tabular-nums reads as a
    // violation even when the element is correct. Keep both in the same
    // literal. Confirmed against MetricTile.
    // Lookbehind excludes token-name strings like '--text-metric';
    // only utility-class usage (start-of-string or space-delimited) trips.
    selector: 'Literal[value=/(?<![-a-zA-Z])text-metric(-sm)?\\b/]:not([value=/tabular-nums/])',
    message:
      'Metric text without tabular-nums. Misaligned figure columns in a financial tool are a correctness hazard, not an aesthetic one — every element rendering a number carries tabular-nums. See docs/design-system.md §8.6.',
  },
  {
    selector: 'Literal[value=/focus(-visible|-within)?:(ring|shadow)/]',
    message:
      'Focus ring via ring/shadow utilities is box-shadow-based and gets clipped by overflow:hidden on scrolling table containers — a guaranteed bug in this product. Use outline utilities with outline-offset. See docs/design-system.md §4 "Focus ring".',
  },
  {
    selector: 'TemplateElement[value.raw=/focus(-visible|-within)?:(ring|shadow)/]',
    message:
      'Focus ring via ring/shadow utilities is box-shadow-based and gets clipped by overflow:hidden on scrolling table containers — a guaranteed bug in this product. Use outline utilities with outline-offset. See docs/design-system.md §4 "Focus ring".',
  },
];

// Bracketed arbitrary values: the gate above reads named utilities (`p-9`,
// `rounded-xl`), so `p-[40px]` or `rounded-[12px]` walked past every cap.
// Found by the 2026-10-08 readiness review, which got 4 of 15 deliberate
// violations caught. Each selector is matched against string literals and
// template chunks, like the gate above.
const softCornerMessage =
  'Softened corner. Every rectangle is square since 2026-10-16, and a 2–8px corner reads as a defect, not a choice. Name the tier token (rounded-xs, -sm, -md, -lg, all 0px) so re-rounding stays a one-line change in theme.css, or rounded-full for a dot, avatar, count badge, switch or track. See docs/design-system.md §7.7.';
const bracketMessage = (what) =>
  `Bracketed ${what} bypasses the cap the named utilities enforce. Use the token (px-[var(--pad-cell-x)], h-[var(--h-control)], rounded-sm), or go through the spec if a new step is genuinely needed. See docs/design-system.md §7 and CLAUDE.md rule 6.`;
const colorUtility =
  '(bg|text|border(-[trblxyse])?|outline|fill|stroke|ring|decoration|divide|accent|caret|placeholder|from|via|to)';
const bothForms = (pattern, message) => [
  { selector: `Literal[value=/${pattern}/]`, message },
  { selector: `TemplateElement[value.raw=/${pattern}/]`, message },
];
const arbitraryValueGate = [
  // Spacing above 32px. Matches 33–99px and three-digit px, any rem.
  ...bothForms(
    '\\b-?(p|px|py|ps|pe|pt|pb|pl|pr|m|mx|my|ms|me|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-\\[(3[3-9]|[4-9]\\d|\\d{3,})(\\.\\d+)?px\\]',
    bracketMessage('spacing above 32px'),
  ),
  // Height and square size above the 36px control ceiling. min-h/max-h are
  // layout regions (a dropzone, a scroll list), not controls, and stay legal.
  ...bothForms('(?<![-a-z])(h|size)-\\[(3[7-9]|[4-9]\\d|\\d{3,})(\\.\\d+)?px\\]', bracketMessage('height above 36px')),
  // Square corners (§7.7, 2026-10-16): a rectangle names its tier token
  // (rounded-xs…lg, all 0px) or is round (rounded-full). A bracketed radius
  // is legal only as a tier token, `inherit` or 0; any other length softens a
  // corner the system squared, including ones under the 8px cap. Bare
  // `rounded` and its side forms (`rounded-t`) are Tailwind's 4px default.
  // Added 2026-10-22, before the kit goes public (owner's decision).
  ...bothForms('\\brounded(-[a-z]{1,2})?-\\[(?!var\\(--radius-|inherit\\]|0(px)?\\])[^\\]]+\\]', softCornerMessage),
  ...bothForms('(?<![-\\w\\[])rounded(-(ss|se|ee|es|tl|tr|br|bl|s|e|t|r|b|l))?(?![-\\w\\[])', softCornerMessage),
  ...bothForms(
    '\\bfont-\\[[7-9]00\\]',
    'Font weight above 600: at 13px on a dark canvas, bold weights bloom and reduce legibility. The scale caps at font-semibold. See docs/design-system.md §8.5.',
  ),
  // §4 Elevation: the system has one shadow, `shadow-overlay`, and
  // `shadow-none`. Everything else in the four shadow namespaces is rejected:
  // named steps, bracketed values, and shadow COLOUR utilities
  // (`shadow-border-strong`), which repaint both layers of the overlay sheet
  // and turn it solid with no error. Tailwind's stock scales are stripped
  // too (§9), so a stray `shadow-md` would compile to nothing; this says why.
  ...bothForms(
    '(?<![-a-z])(inset-shadow|drop-shadow|text-shadow|shadow(?!-(overlay|none)(?![-\\w\\[\\/])))(-|\\b)',
    'Shadow utility other than shadow-overlay or shadow-none. §4 allows one shadow: the overlay sheet, on overlays only (Dialog, the sidebar peek). Popups and controls take a background step plus a 1px border. A shadow colour utility repaints both layers of the sheet and turns it solid. See docs/design-system.md §4 "Elevation".',
  ),
  ...bothForms(
    '\\[box-shadow:',
    'Arbitrary box-shadow property. §4 allows one shadow, shadow-overlay, on overlays only. See docs/design-system.md §4 "Elevation".',
  ),
  // Raw colour functions inside a colour utility.
  ...bothForms(
    `\\b${colorUtility}-\\[[^\\]]*\\b(rgba?|hsla?|oklch|oklab|lch|lab|color)\\(`,
    'Raw colour function in a utility bypasses the token layer: it cannot mode-switch and its contrast was never measured. Use the --color-* semantic utilities. See docs/design-system.md §9 and CLAUDE.md rule 10.',
  ),
  ...bothForms(
    `\\b${colorUtility}-(white|black)\\b`,
    'White and black are not tokens: they do not switch with the mode, and §0 rule 9 bans pure black outright. Use the --color-* semantic utilities (bg-canvas, text-text-primary, text-on-interactive).',
  ),
];

// Component code only, not stories: stories legitimately lay out their
// fixtures with inline styles and plain elements.
const inlineStyleGate = [
  {
    selector:
      "JSXAttribute[name.name='style'] Property[key.name=/^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke)$/] > Literal[value=/^(?!var\\().+/]",
    message:
      'Literal colour in an inline style bypasses the token layer and cannot mode-switch. Use a semantic utility class, or var(--color-…) if it must be inline. See CLAUDE.md rule 10.',
  },
  {
    selector:
      "JSXAttribute[name.name='style'] Property[key.name=/^(padding|margin|gap|rowGap|columnGap)(Top|Right|Bottom|Left|Inline|Block)?(Start|End)?$/] > Literal",
    message:
      'Literal spacing in an inline style bypasses the spacing tokens and the 32px cap. Use a token utility (px-[var(--pad-cell-x)]), or calc() over var(--…) if it must be inline. See docs/design-system.md §7.',
  },
  {
    // §7.7: a radius in an inline style is a softened corner the class gate
    // cannot see. 0 is allowed; anything else goes through a tier token.
    selector:
      "JSXAttribute[name.name='style'] Property[key.name=/^border(TopLeft|TopRight|BottomLeft|BottomRight|StartStart|StartEnd|EndStart|EndEnd)?Radius$/] > Literal[value!=0][value!='0'][value!='0px']",
    message: softCornerMessage,
  },
  {
    selector: "JSXAttribute[name.name='style'] Property[key.name=/^(boxShadow|textShadow)$/]",
    message:
      'Shadow in an inline style. §4 allows one shadow, the shadow-overlay utility, on overlays only. See docs/design-system.md §4 "Elevation".',
  },
  {
    selector:
      "JSXAttribute[name.name='style'] Property[key.name='fontWeight'] > Literal[raw=/^['\"]?([7-9]00|bold|bolder)['\"]?$/]",
    message:
      'Font weight above 600: at 13px on a dark canvas, bold weights bloom and reduce legibility. See docs/design-system.md §8.5.',
  },
];

// Outside the foundational layer, a <button> is a primitive re-implemented
// inline: the second button nobody knows about. Extend Button or IconButton
// with a variant instead. CLAUDE.md, "Never re-implement a primitive inline".
const inlineButtonGate = [
  {
    selector: "JSXOpeningElement[name.name='button']",
    message:
      'Inline <button> outside src/components/foundational. Use Button or IconButton, and add a variant there if none fits (that is a foundational change: ask first). See CLAUDE.md "Never re-implement a primitive inline".',
  },
  // The same element reached through a variable: `const Row = expandable ?
  // 'button' : 'div'` rendered as <Row>. JSX only treats a capitalised name as
  // a tag variable, so a PascalCase binding holding 'button' is exactly that
  // case, and `type={x ? 'button' : 'submit'}` is not caught. RunLogRow
  // shipped this way until 2026-10-12.
  {
    selector: "VariableDeclarator[id.name=/^[A-Z]/] Literal[value='button']",
    message:
      'A component variable that can hold \'button\' renders an inline <button> outside src/components/foundational. Render Button (variant="inline" inside a row) for that case instead. See CLAUDE.md "Never re-implement a primitive inline".',
  },
  {
    selector: "CallExpression[callee.property.name='createElement'] > Literal[value='button']:first-child",
    message:
      'createElement(\'button\') is an inline <button> outside src/components/foundational. Use Button or IconButton. See CLAUDE.md "Never re-implement a primitive inline".',
  },
];

// Badge and ProgressBar renamed their colour prop from `role` to `tone` on
// 2026-10-09: `role` is the ARIA attribute. A tone name in `role` still works
// (and warns in development), so nothing breaks, but new code uses `tone`.
const toneNotRoleGate = [
  {
    selector:
      "JSXOpeningElement[name.name=/^(Badge|ProgressBar|StatusBadge|CountBadge)$/] > JSXAttribute[name.name='role'] Literal[value=/^(neutral|interactive|danger|warning|success|agent|info)$/]",
    message:
      'Colour goes in `tone`, not `role`: role is the ARIA attribute that tells assistive technology what an element is (renamed 2026-10-09). Write tone="danger". See the Badge README.',
  },
];

// `destructive` → `danger` (renamed 2026-10-10). One word per state, and the
// system's own: Badge, ProgressBar and every token already say danger. The old
// spelling still renders (src/components/foundational/dangerVariant.ts), so
// only new code is stopped here.
const dangerMessage =
  'The red variant is `danger`, not `destructive` (renamed 2026-10-10): one word per state, the same as Badge, ProgressBar and the --color-*-danger tokens. Write variant="danger". See src/components/foundational/dangerVariant.ts.';
const dangerNotDestructiveGate = [
  { selector: "JSXAttribute[name.name='variant'] Literal[value='destructive']", message: dangerMessage },
  { selector: "Property[key.name='variant'] > Literal[value='destructive']", message: dangerMessage },
];

// §7.3 "Frame tier". --pad-frame-* is the one spacing tier above 32px, and
// only shell components may spend it: anywhere else it is component spacing
// past the cap under another name. The allowlist is the block at the end.
const frameTierMessage =
  'Frame-tier token outside a shell component. --pad-frame-* is the one spacing tier above 32px because it is paid once per page, not once per row; in a table, card or form it is component spacing past the cap under another name. Only shells may use it: AppShell, EmptyState, and an app\'s top-level layout (apps/*/src/App.tsx). A screen gets its page air from the shell around it. See docs/design-system.md §7.3 "Frame tier".';
const frameTierGate = [
  { selector: 'Literal[value=/--pad-frame-/]', message: frameTierMessage },
  { selector: 'TemplateElement[value.raw=/--pad-frame-/]', message: frameTierMessage },
];

const relativeImportsOnly = {
  regex: '^@/',
  message:
    'Import relatively (../../lib/utils), not through `@/`. Tabular UI is compiled by consuming apps, which would each have to alias `@` to tabular-ui/src, colliding with their own. See tools.md, "UI primitives".',
};

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/storybook-static',
    '**/test-results',
    '**/playwright-report',
    '**/visual-report',
    '**/visual-results',
    '**/visual-gate',
    '**/.registry',
    'apps/storybook/public/r',
    // React Router's prerendered build and generated route types (apps/site).
    'apps/site/build',
    'apps/site/.react-router',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // React Router route modules export route functions beside the component
    // (meta, links, Layout, ErrorBoundary). React Router's Vite plugin keeps
    // fast refresh working for these names, so react-refresh is told about them
    // rather than flagging every route in apps/site.
    files: ['apps/site/src/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: [
            'meta',
            'links',
            'headers',
            'handle',
            'loader',
            'clientLoader',
            'action',
            'clientAction',
            'middleware',
            'clientMiddleware',
            'shouldRevalidate',
            'Layout',
            'ErrorBoundary',
            'HydrateFallback',
          ],
        },
      ],
    },
  },
  {
    // Tabular UI design-system gate — ESLint half, covering utility class strings
    // and literals in component code. The CSS half is lint/stylelint-tui.mjs.
    // tools.md calls these rules "the primary design system gate". Each
    // message explains why and cites the spec (scaffold Task 6).
    // Workspace apps consume the system and are held to the same gate.
    files: ['packages/ui/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designGate,
        ...arbitraryValueGate,
        ...frameTierGate,
        ...inlineStyleGate,
        ...inlineButtonGate,
        ...toneNotRoleGate,
        ...dangerNotDestructiveGate,
      ],
    },
  },
  {
    // The foundational layer is where buttons are built, so it may render one.
    files: ['packages/ui/src/components/foundational/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designGate,
        ...arbitraryValueGate,
        ...frameTierGate,
        ...inlineStyleGate,
        ...toneNotRoleGate,
        ...dangerNotDestructiveGate,
      ],
    },
  },
  {
    // Shells own the page frame (§7.3 "Frame tier"): the full gate minus the
    // frame-tier ban. An app's App.tsx is its shell — apps/demo builds its
    // own <main> there rather than using AppShell. Screens stay banned. Must stay AFTER the gate block — flat config
    // applies later blocks over earlier ones for the same rule.
    files: [
      'packages/ui/src/components/product/AppShell/**/*.{ts,tsx}',
      'packages/ui/src/components/product/EmptyState/**/*.{ts,tsx}',
      'apps/*/src/App.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designGate,
        ...arbitraryValueGate,
        ...inlineStyleGate,
        ...inlineButtonGate,
        ...toneNotRoleGate,
        ...dangerNotDestructiveGate,
      ],
    },
  },
  {
    // Stories: the class-string gate still applies in full, but fixtures may
    // lay themselves out with inline styles and plain elements, and a shell's
    // stories demonstrate the frame tier. Must stay LAST of these blocks.
    files: ['packages/ui/src/**/*.stories.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designGate,
        ...arbitraryValueGate,
        ...toneNotRoleGate,
        ...dangerNotDestructiveGate,
      ],
    },
  },
  {
    // Library source imports relatively, never through `@/`. Consuming apps
    // compile Tabular UI as source (exports → src/index.ts), so every `@/` import
    // here forced each app to alias `@` to tabular-ui/src, which collides with the
    // app's own `@/` (removed 2026-10-09). `shadcn add` writes `@/lib/utils`
    // by default: rewrite it to a relative path. The root tsconfig keeps the
    // alias only so the shadcn CLI runs.
    files: ['packages/ui/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [relativeImportsOnly],
        },
      ],
    },
  },
  {
    // Kasane fixtures (packages/ui/src/fixtures/, generated from the Kasane dataset by
    // apps/demo/scripts/export-fixtures.mjs) are story data. Library code that
    // imported them would ship a fictional company to every consuming app.
    files: ['packages/ui/src/**/*.{ts,tsx}'],
    ignores: ['packages/ui/src/**/*.stories.tsx', 'packages/ui/src/fixtures/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            relativeImportsOnly,
            {
              regex: '(^|/)fixtures(/|$)',
              message:
                'src/fixtures/ is story data only (the fictional Kasane dataset). Import it from a *.stories.tsx file, never from a component or src/index.ts.',
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
]);
