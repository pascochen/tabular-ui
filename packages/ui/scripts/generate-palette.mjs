#!/usr/bin/env node
// Generates the Tabular UI "Riso Ledger" colour ramps and writes docs/palette.md, docs/palette.json (at the
// repo root) and packages/ui/src/styles/palette.css (the primitive layer theme.css points its semantic tokens at).
//
//   pnpm --filter tabular-ui palette [--old docs/reference/tui-palette-main.json]
//
// Each ramp is a hue, a shared lightness curve and a chroma curve, defined in OKLCH.
// Every colour is kept inside sRGB (no Display P3), so older screens show what is specified.
// No hex value is typed by hand: hex values are computed from OKLCH.

import { converter, displayable, formatHex, wcagContrast } from 'culori';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// docs/ is shared by the whole repo, so it sits at the top, two levels up.
const repo = resolve(root, '../..');
const args = process.argv.slice(2);
const oldPath = resolve(
  repo,
  args.includes('--old') ? args[args.indexOf('--old') + 1] : 'docs/reference/tui-palette-main.json',
);

const toOklch = converter('oklch');
const toRgb = converter('rgb');

// ---------------------------------------------------------------------------
// 1. Steps and the shared lightness curve (OKLCH L, %).
//    Same curve for every ramp, so a step number means the same contrast everywhere:
//    on paper-50, 500 >= 3:1, 600 >= 4.5:1, 700 >= 6:1; on ink-950, 500 >= 4.5:1.
// ---------------------------------------------------------------------------
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHTNESS = [97.5, 94.5, 89, 82, 73, 62.5, 53, 46, 38.5, 30.5, 21];

// Chroma curves: share of the ramp's peak chroma at each step, peaking in the middle.
const SHAPES = {
  mid: [0.1, 0.2, 0.4, 0.65, 0.88, 1.0, 1.0, 0.9, 0.75, 0.6, 0.45],
  // Sage character at the light and dark ends, leaf-strength chroma at 400–600.
  sage: [0.08, 0.15, 0.3, 0.55, 0.85, 1.0, 1.0, 0.8, 0.55, 0.4, 0.3],
  // Yellow can only be vivid when light, so its chroma peaks earlier.
  yellow: [0.15, 0.35, 0.65, 0.9, 1.0, 0.95, 0.85, 0.75, 0.65, 0.55, 0.45],
};

// Keep every colour just inside sRGB (2% margin) so rounding never pushes it out.
const GAMUT_MARGIN = 0.98;

// ---------------------------------------------------------------------------
// 2. Hue anchors: RISO spot inks. Hex and Pantone from the riso-colors package
//    (Matt DesLauriers, last updated Feb 2019), compiled from stencil.wiki/colors.
//    These hex values are on-screen approximations of printed ink.
// ---------------------------------------------------------------------------
const SOURCE = {
  name: 'riso-colors (npm) by Matt DesLauriers, compiled from stencil.wiki/colors',
  urls: ['https://www.npmjs.com/package/riso-colors', 'https://www.stencil.wiki/colors'],
};
const INKS = {
  midnight: { ink: 'Midnight', hex: '#435060', pantone: '296 U' },
  green: { ink: 'Green', hex: '#00a95c', pantone: '354 U' },
  crimson: { ink: 'Crimson', hex: '#e45d50', pantone: '485 U' },
  sunflower: { ink: 'Sunflower', hex: '#ffb511', pantone: '116 U' },
  mediumBlue: { ink: 'Medium Blue', hex: '#3255a4', pantone: '286 U' },
  orchid: { ink: 'Orchid', hex: '#aa60bf', pantone: '2592 U' },
  lightTeal: { ink: 'Light Teal', hex: '#009da5', pantone: '320 U' },
};
for (const ink of Object.values(INKS)) {
  const o = toOklch(ink.hex);
  Object.assign(ink, { l: o.l * 100, c: o.c, h: o.h });
}

// ---------------------------------------------------------------------------
// 3. Ramps.
// ---------------------------------------------------------------------------
// The neutral runs warm at the light end (paper) and cool at the dark end (ink),
// with chroma dipping to almost zero in the middle so the hue change never shows
// as a muddy grey-green. Paper is not an ink: its 85° hue comes from the portfolio paper.
const PAPER_HUE = 85;
const LEDGER_CHROMA = [0.012, 0.014, 0.015, 0.014, 0.008, 0.003, 0.005, 0.01, 0.014, 0.017, 0.018];
const LEDGER_HUE = STEPS.map((_, i) => (i <= 5 ? PAPER_HUE : INKS.midnight.h));

const RAMPS = [
  {
    name: 'ledger',
    role: 'Neutral: surfaces, borders, text',
    replaces: 'olive',
    anchor: INKS.midnight,
    neutral: true,
    note: 'Warm paper (85°) at the light end, RISO Midnight at the dark end.',
  },
  { name: 'sage', role: 'Primary, success', replaces: 'emerald', anchor: INKS.green, shape: 'sage' },
  {
    name: 'vermilion',
    role: 'Danger',
    replaces: 'red',
    anchor: INKS.crimson,
    shape: 'mid',
    note: "The ledger's red rule and seal (shu, vermilion).",
  },
  {
    name: 'ochre',
    role: 'Warning',
    replaces: 'amber',
    anchor: INKS.sunflower,
    shape: 'yellow',
    note: 'Dark steps turn ochre and brown: a yellow cannot stay vivid when dark.',
  },
  {
    name: 'federal',
    role: 'Info',
    replaces: 'sky',
    anchor: INKS.mediumBlue,
    shape: 'mid',
    note: 'Hue of RISO Federal Blue (264°); chroma from RISO Medium Blue, same hue, because Federal Blue (0.089) reads greyed-out.',
  },
  {
    name: 'orchid',
    role: 'Agent',
    replaces: 'violet',
    anchor: INKS.orchid,
    shape: 'mid',
    note: 'Moved from violet so agent does not read as a second blue next to info.',
  },
  {
    name: 'teal',
    role: 'Charts',
    replaces: null,
    anchor: INKS.lightTeal,
    shape: 'mid',
    note: 'Fills the gap between green and blue on the hue wheel.',
  },
];

// Largest chroma that stays inside sRGB at this lightness and hue.
function maxSrgbChroma(lPercent, h) {
  let lo = 0,
    hi = 0.4;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (displayable({ mode: 'oklch', l: lPercent / 100, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
}

// APCA-W3 0.0.98G. Returns |Lc|: 90+ preferred body text, 75 minimum body, 60 large text.
function apcaLc(textHex, bgHex) {
  const Y = (hex) => {
    const { r, g, b } = toRgb(hex);
    const y = 0.2126729 * Math.max(r, 0) ** 2.4 + 0.7151522 * Math.max(g, 0) ** 2.4 + 0.072175 * Math.max(b, 0) ** 2.4;
    return y > 0.022 ? y : y + (0.022 - y) ** 1.414;
  };
  const yt = Y(textHex),
    yb = Y(bgHex);
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : Math.abs((s + 0.027) * 100);
}

const clipped = [];
const ramps = RAMPS.map((ramp) => {
  const steps = STEPS.map((step, i) => {
    const l = LIGHTNESS[i];
    const h = ramp.neutral ? LEDGER_HUE[i] : ramp.anchor.h;
    const wanted = ramp.neutral ? LEDGER_CHROMA[i] : ramp.anchor.c * SHAPES[ramp.shape][i];
    const limit = maxSrgbChroma(l, h) * GAMUT_MARGIN;
    const c = Math.min(wanted, limit);
    if (wanted > limit) clipped.push({ token: `${ramp.name}-${step}`, wanted, allowed: limit });
    return { step, l, c, h };
  });
  return { ...ramp, steps };
});

// Ledger's one extra step, 925. Dark mode needs a raised surface (menus, popovers, dialogs) between
// the canvas (950, L 21) and 900 (L 30.5): on 900, role text on a highlighted menu row measured
// 3.97–4.45:1, under AA. 925 is the midpoint of its neighbours in lightness and chroma, at their
// shared ink hue. Neutral only: no chromatic ramp needs it, and the shared curve keeps eleven steps.
const ledger = ramps.find((r) => r.name === 'ledger');
{
  const s900 = ledger.steps.find((s) => s.step === 900);
  const s950 = ledger.steps.find((s) => s.step === 950);
  const l = (s900.l + s950.l) / 2;
  const h = s950.h;
  const wanted = (s900.c + s950.c) / 2;
  const limit = maxSrgbChroma(l, h) * GAMUT_MARGIN;
  if (wanted > limit) clipped.push({ token: 'ledger-925', wanted, allowed: limit });
  ledger.steps.splice(ledger.steps.indexOf(s950), 0, { step: 925, l, c: Math.min(wanted, limit), h });
}

const hexOf = (s) => formatHex({ mode: 'oklch', l: s.l / 100, c: s.c, h: s.h });
const PAPER_50 = hexOf(ledger.steps.find((s) => s.step === 50));
const INK_950 = hexOf(ledger.steps.find((s) => s.step === 950));

for (const ramp of ramps) {
  for (const s of ramp.steps) {
    s.hex = hexOf(s);
    // One decimal of lightness, two only where a step needs them (ledger-925, L 25.75).
    s.oklch = `oklch(${s.l.toFixed(Number.isInteger(s.l * 10) ? 1 : 2)}% ${s.c.toFixed(3)} ${s.h.toFixed(1)})`;
    // palette.css ships the rounded oklch() string, not the hex, so that is what must be in sRGB.
    s.inSrgb = displayable(s.oklch);
    s.wcagPaper = wcagContrast(s.hex, PAPER_50);
    s.wcagInk = wcagContrast(s.hex, INK_950);
    s.apcaPaper = apcaLc(s.hex, PAPER_50);
    s.apcaInk = apcaLc(s.hex, INK_950);
  }
}

// ---------------------------------------------------------------------------
// 4. Current Tabular UI palette, for the old-vs-new comparison.
// ---------------------------------------------------------------------------
let old = {};
try {
  old = JSON.parse(readFileSync(oldPath, 'utf8')).primitives ?? {};
} catch {
  console.warn(`Could not read the current palette at ${oldPath}; skipping the comparison.`);
}

// ---------------------------------------------------------------------------
// 5. Write docs/palette.md and docs/palette.json.
// ---------------------------------------------------------------------------
const f2 = (n) => n.toFixed(2);
const f1 = (n) => n.toFixed(1);
const lines = [];
lines.push(
  '# Tabular UI palette: Riso Ledger',
  '',
  'Generated by `scripts/generate-palette.mjs`. Do not edit by hand: change the script and run it again.',
  '',
  'A mid-century Japanese ledger book printed in RISO spot inks: warm paper, blue-black ink, vermilion and blue rules.',
  'Every colour sits inside sRGB, so older and low-end screens show exactly what is specified.',
  '',
  `Contrast is measured against **paper** (\`ledger-50\` ${PAPER_50}) and **ink** (\`ledger-950\` ${INK_950}).`,
  'APCA Lc is shown as an absolute value: about 90 is preferred for body text, 75 the minimum for body text, 60 for large text.',
  '',
  '## Contrast rules',
  '',
  'Every ramp shares one lightness curve, so these hold for every ramp:',
  '',
  '| Step | On paper | On ink | Use for |',
  '|---|---|---|---|',
  '| 500 | at least 3:1 | at least 4.5:1 | Icons, borders, large text; dark-mode text |',
  '| 600 | at least 4.5:1 | | Body text and links on paper |',
  '| 700 | at least 6:1 | | Small labels on paper |',
  '',
  '| Step | ' + STEPS.join(' | ') + ' |',
  '|---|' + STEPS.map(() => '---').join('|') + '|',
  '| OKLCH L | ' + LIGHTNESS.map((l) => `${l}%`).join(' | ') + ' |',
  '',
  'Ledger alone has a twelfth step, **925** (L 25.75%, the midpoint of 900 and 950): the dark-mode raised surface for menus, popovers and dialogs.',
  '',
);
for (const r of ramps) {
  lines.push(
    `## ${r.name}`,
    '',
    `${r.role}.${r.replaces ? ` Replaces \`${r.replaces}\`.` : ''} ${r.note ?? ''}`.trim(),
    '',
  );
  lines.push(
    '| Step | oklch() | Hex | WCAG vs paper | WCAG vs ink | APCA Lc vs paper | APCA Lc vs ink |',
    '|---|---|---|---|---|---|---|',
  );
  for (const s of r.steps) {
    const mark = clipped.some((c) => c.token === `${r.name}-${s.step}`) ? ' ◆' : '';
    lines.push(
      `| ${s.step}${mark} | \`${s.oklch}\` | \`${s.hex}\` | ${f2(s.wcagPaper)} | ${f2(s.wcagInk)} | ${f1(s.apcaPaper)} | ${f1(s.apcaInk)} |`,
    );
  }
  lines.push('', '◆ chroma limited by sRGB at this step (see Gamut report).', '');
}

lines.push(
  '## Hue anchors',
  '',
  `Source: ${SOURCE.name} (${SOURCE.urls.join(', ')}). These hex values are on-screen approximations of printed RISO ink; fluorescent RISO inks cannot be shown on screen at all and are not used here.`,
  '',
);
lines.push(
  '| Ramp | RISO ink | Ink hex | Pantone | Ink OKLCH | Ramp hue | Peak chroma |',
  '|---|---|---|---|---|---|---|',
);
for (const r of ramps) {
  const a = r.anchor;
  const hue = r.neutral ? `${PAPER_HUE}° → ${f1(a.h)}°` : `${f1(a.h)}°`;
  const peak = Math.max(...r.steps.map((s) => s.c)).toFixed(3);
  lines.push(
    `| ${r.name} | ${a.ink} | \`${a.hex}\` | ${a.pantone} | \`oklch(${f1(a.l)}% ${a.c.toFixed(3)} ${f1(a.h)})\` | ${hue} | ${peak} |`,
  );
}
const accentHues = ramps
  .filter((r) => !r.neutral)
  .map((r) => [r.name, r.anchor.h])
  .sort((a, b) => a[1] - b[1]);
lines.push('', 'Accent hues around the OKLCH wheel, with the gap to the next one:', '');
accentHues.forEach(([n, h], i) => {
  const [nn, nh] = accentHues[(i + 1) % accentHues.length];
  lines.push(`- ${n} ${f1(h)}° → ${nn} ${f1(nh)}°: ${Math.round((nh - h + 360) % 360)}°`);
});
lines.push('');

lines.push(
  '## Gamut report',
  '',
  clipped.length
    ? `${clipped.length} steps wanted more chroma than sRGB allows at their lightness and hue; each was set just inside sRGB (${GAMUT_MARGIN * 100}% of the maximum).`
    : 'No step needed clipping.',
  '',
);
if (clipped.length) {
  lines.push('| Token | Wanted chroma | Used (sRGB limit) |', '|---|---|---|');
  for (const c of clipped) lines.push(`| ${c.token} | ${c.wanted.toFixed(3)} | ${c.allowed.toFixed(3)} |`);
  lines.push('');
}
const outside = ramps.flatMap((r) => r.steps.filter((s) => !s.inSrgb).map((s) => `${r.name}-${s.step}`));
lines.push(
  outside.length
    ? `**Warning:** outside sRGB after rounding: ${outside.join(', ')}`
    : 'All generated colours are inside sRGB.',
  '',
);

lines.push(
  '## Old and new',
  '',
  'The current Tabular UI ramps (Tailwind defaults) against their replacements. ✕ marks a current colour outside sRGB, which sRGB screens clip.',
  '',
);
for (const r of ramps) {
  const o = r.replaces && old[r.replaces];
  if (!o) continue;
  lines.push(
    `### ${r.replaces} → ${r.name}`,
    '',
    '| Step | Old oklch() | Old hex | New oklch() | New hex | ΔL |',
    '|---|---|---|---|---|---|',
  );
  for (const s of r.steps) {
    const os = o[s.step];
    if (!os) {
      lines.push(`| ${s.step} | — | — | \`${s.oklch}\` | \`${s.hex}\` | |`);
      continue;
    }
    const ol = parseFloat(String(os.oklch).match(/oklch\(([\d.]+)%/)?.[1] ?? 'NaN');
    const flag = os.inSrgbGamut === false ? ' ✕' : '';
    lines.push(
      `| ${s.step} | \`${os.oklch}\`${flag} | \`${os.hex}\` | \`${s.oklch}\` | \`${s.hex}\` | ${Number.isNaN(ol) ? '' : f1(s.l - ol)} |`,
    );
  }
  const outCount = STEPS.filter((st) => o[st].inSrgbGamut === false).length;
  lines.push('', `${r.replaces}: ${outCount} of 11 outside sRGB. ${r.name}: 0 of ${r.steps.length}.`, '');
}

mkdirSync(resolve(repo, 'docs'), { recursive: true });
writeFileSync(resolve(repo, 'docs/palette.md'), lines.join('\n'));
writeFileSync(
  resolve(repo, 'docs/palette.json'),
  JSON.stringify(
    {
      generatedBy: 'scripts/generate-palette.mjs',
      paper50: PAPER_50,
      ink950: INK_950,
      ramps: Object.fromEntries(
        ramps.map((r) => [r.name, Object.fromEntries(r.steps.map((s) => [s.step, { oklch: s.oklch, hex: s.hex }]))]),
      ),
    },
    null,
    2,
  ) + '\n',
);

// ---------------------------------------------------------------------------
// 6. Write src/styles/palette.css: one theme variable per step, from the same oklch() strings.
// ---------------------------------------------------------------------------
const css = [
  '/* Riso Ledger primitives. GENERATED by scripts/generate-palette.mjs, from the',
  '   values in docs/palette.md. Do not edit by hand: change the script and run it.',
  '',
  '   Imported by src/index.css AFTER theme.css, on purpose. theme.css strips',
  "   Tailwind's own colour scales, teal among them; a strip that ran after this",
  '   file would erase the Riso teal ramp too, silently. `static` emits every',
  '   step whether or not anything references it, as theme.css does for its own',
  '   tokens. Components never name these ramps (lint rejects them): colour is',
  '   reached through the semantic tokens in theme.css. */',
  '@theme static {',
  ramps.map((r) => r.steps.map((s) => `  --color-${r.name}-${s.step}: ${s.oklch};`).join('\n')).join('\n\n'),
  '}',
  '',
].join('\n');
mkdirSync(resolve(root, 'src/styles'), { recursive: true });
writeFileSync(resolve(root, 'src/styles/palette.css'), css);

const colours = ramps.reduce((n, r) => n + r.steps.length, 0);
console.log(
  `Wrote docs/palette.md, docs/palette.json and packages/ui/src/styles/palette.css (${ramps.length} ramps, ${colours} colours).`,
);
console.log(`Clipped to sRGB: ${clipped.length}`);
for (const c of clipped) console.log(`  ${c.token}: wanted ${c.wanted.toFixed(3)}, used ${c.allowed.toFixed(3)}`);
if (outside.length) {
  console.error(`Outside sRGB after rounding: ${outside.join(', ')}`);
  process.exitCode = 1;
}
