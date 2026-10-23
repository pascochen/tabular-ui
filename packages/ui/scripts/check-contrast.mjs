#!/usr/bin/env node
// Checks WCAG contrast for every colour token in src/styles/theme.css, in light and dark.
//
//   pnpm --filter tabular-ui contrast
//
// Reads the tokens as they ship: each --tui-* value in theme.css, resolved through the
// generated ramps in src/styles/palette.css. A colour value that is not a palette reference
// (a hex, a literal oklch()) fails the run, since every colour must come from the generator.
//
// Translucent layers (tints, the hover overlay) are composited in sRGB and rounded to 8 bits
// per channel, as the browser and axe do. tests/contrast.spec.ts measures the same grounds
// in a real browser; this script is the fast, complete pass over every token and ground.
//
// Thresholds (docs/design-system.md §3, §4, §6):
// - text and on-colours 4.5:1 on every ground they sit on
// - --color-text-tertiary 4.5:1 where it is a placeholder (canvas, surface, raised), and
//   3:1 on row states, where it only marks icons (§3)
// - the focus ring, solid fills and chart series 3:1
// - --color-text-disabled is reported, never failed (WCAG 1.4.3 exempts it)
// - --color-border and --color-border-strong are reported, never failed (§3 publishes them)
//
// Every --tui-* colour is resolved, including the ones no threshold reads (the role borders,
// the pressed overlay), and both modes must declare the same set: a token missing from dark
// would silently fall back to its light value.

import { converter, formatHex, wcagContrast } from 'culori';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const toRgb = converter('rgb');

// ---------------------------------------------------------------------------
// 1. Read the palette and the two modes.
// ---------------------------------------------------------------------------
const palette = new Map(
  [...read('src/styles/palette.css').matchAll(/(--color-[a-z]+-\d+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]),
);

const theme = read('src/styles/theme.css');
function block(selector) {
  const decls = new Map();
  let at = 0;
  for (;;) {
    const start = theme.indexOf(`${selector} {`, at);
    if (start === -1) break;
    const end = theme.indexOf('\n}', start);
    for (const m of theme.slice(start, end).matchAll(/(--tui-[a-z0-9-]+):\s*([^;]+);/g)) decls.set(m[1], m[2].trim());
    at = end;
  }
  return decls;
}
const MODES = { light: block(':root'), dark: block("[data-theme='dark']") };
for (const [a, b] of [
  ['light', 'dark'],
  ['dark', 'light'],
])
  for (const name of MODES[a].keys())
    if (!MODES[b].has(name)) throw new Error(`${name} is declared in ${a} mode but not in ${b}`);

// A layer is { hex, alpha }. Only palette references are allowed.
function layer(token, decls, mode) {
  const value = decls.get(`--tui-${token}`);
  if (!value) throw new Error(`${mode}: --tui-${token} is not declared in theme.css`);
  const solid = value.match(/^var\((--color-[a-z]+-\d+)\)$/);
  const tint = value.match(/^--alpha\(var\((--color-[a-z]+-\d+)\) \/ ([\d.]+)%\)$/);
  const ref = solid?.[1] ?? tint?.[1];
  if (!ref) throw new Error(`${mode}: --tui-${token} is "${value}", not a palette reference`);
  if (!palette.has(ref)) throw new Error(`${mode}: --tui-${token} points at ${ref}, which palette.css does not define`);
  return {
    ref: ref.replace('--color-', ''),
    hex: formatHex(palette.get(ref)),
    alpha: tint ? Number(tint[2]) / 100 : 1,
  };
}

// Paint layers bottom to top, as a canvas does.
function composite(layers) {
  let out = toRgb(layers[0].hex);
  for (const { hex, alpha } of layers.slice(1)) {
    const top = toRgb(hex);
    const mix = (b, t) => Math.round((alpha * t + (1 - alpha) * b) * 255) / 255;
    out = { mode: 'rgb', r: mix(out.r, top.r), g: mix(out.g, top.g), b: mix(out.b, top.b) };
  }
  return formatHex(out);
}

// ---------------------------------------------------------------------------
// 2. Check.
// ---------------------------------------------------------------------------
const ROLES = ['interactive', 'danger', 'warning', 'success', 'agent', 'info'];
const failures = [];
const lines = [];

for (const [mode, decls] of Object.entries(MODES)) {
  const L = (token) => layer(token, decls, mode);
  const [canvas, surface, raised, hover, selected] = [
    'canvas',
    'surface',
    'surface-raised',
    'bg-hover',
    'bg-interactive',
  ].map(L);
  // Every ground text sits on: the three surfaces, and the row states §4 lists.
  const GROUNDS = {
    canvas: [canvas],
    surface: [surface],
    raised: [raised],
    'row hover': [canvas, hover],
    'row selected': [canvas, selected],
    'selected + hover': [canvas, selected, hover],
    'popup row hover': [raised, hover],
  };
  const SURFACES = ['canvas', 'surface', 'raised'];

  const results = [];
  const check = (token, ref, ground, ratio, min) => {
    results.push({ token, ref, ground, ratio, min });
    if (min && ratio < min) failures.push(`${mode} ${token} on ${ground}: ${ratio.toFixed(2)} < ${min}`);
  };

  for (const token of ['text-primary', 'text-body', 'text-secondary', 'text-tertiary', 'text-disabled']) {
    const fg = L(token);
    for (const [ground, layers] of Object.entries(GROUNDS)) {
      const min = token === 'text-disabled' ? 0 : token === 'text-tertiary' && !SURFACES.includes(ground) ? 3 : 4.5;
      check(token, fg.ref, ground, wcagContrast(fg.hex, composite(layers)), min);
    }
  }
  for (const role of ROLES) {
    const fg = L(`text-${role}`);
    const tint = L(`bg-${role}`);
    for (const [ground, layers] of Object.entries(GROUNDS)) {
      check(`text-${role}`, fg.ref, ground, wcagContrast(fg.hex, composite(layers)), 4.5);
      check(`text-${role}`, fg.ref, `${ground} + own tint`, wcagContrast(fg.hex, composite([...layers, tint])), 4.5);
    }
    const fill = L(`fill-${role}`);
    const on = L(`on-${role}`);
    check(`on-${role}`, on.ref, `fill-${role} (${fill.ref})`, wcagContrast(on.hex, fill.hex), 4.5);
    // Reported, not failed: hover composites over the fill and is a passing state (§4). The
    // primary (interactive) fill takes the inverse overlay; the overlay sits over the label too.
    const overlay = role === 'interactive' ? L('bg-hover-inverse') : hover;
    check(
      `on-${role}`,
      on.ref,
      `fill-${role} + hover`,
      wcagContrast(composite([on, overlay]), composite([fill, overlay])),
      0,
    );
    check(`fill-${role}`, fill.ref, 'canvas', wcagContrast(fill.hex, canvas.hex), 3);
  }
  const ring = L('ring');
  for (const ground of SURFACES) check('ring', ring.ref, ground, wcagContrast(ring.hex, composite(GROUNDS[ground])), 3);
  for (let i = 1; i <= 7; i++) {
    const series = L(`chart-${i}`);
    for (const ground of SURFACES)
      check(`chart-${i}`, series.ref, ground, wcagContrast(series.hex, composite(GROUNDS[ground])), 3);
  }
  // Rules are reported, not gated: a 1px separator has no WCAG minimum.
  for (const token of ['border', 'border-strong']) {
    const rule = L(token);
    for (const ground of SURFACES)
      check(token, rule.ref, ground, wcagContrast(rule.hex, composite(GROUNDS[ground])), 0);
  }
  // The rest of the --tui-* layer: no threshold reads them, but each must still be a palette reference.
  for (const name of decls.keys()) L(name.slice('--tui-'.length));

  // Report: the lowest ratio per token, with where it happens, then the accepted hover dip.
  const dips = results.filter((r) => r.ground.endsWith('+ hover') && r.token.startsWith('on-'));
  lines.push(`\n${mode.toUpperCase()}`, `${'token'.padEnd(18)}${'value'.padEnd(16)}${'lowest'.padStart(7)}  where`);
  const byToken = Map.groupBy(results, (r) => r.token);
  for (const [token, rs] of byToken) {
    const gated = rs.filter((r) => r.min);
    const worst = (gated.length ? gated : rs).reduce((a, b) => (b.ratio < a.ratio ? b : a));
    const best = rs.reduce((a, b) => (b.ratio > a.ratio ? b : a));
    const status = gated.some((r) => r.ratio < r.min) ? 'FAIL' : gated.length ? 'ok' : 'info';
    lines.push(
      `${token.padEnd(18)}${worst.ref.padEnd(16)}${worst.ratio.toFixed(2).padStart(7)}  ${worst.ground}` +
        ` (best ${best.ratio.toFixed(2)} on ${best.ground})  ${status}`,
    );
  }
  lines.push(
    `On-colours on a hovered fill (reported, not gated): ${dips.map((d) => `${d.token.slice(3)} ${d.ratio.toFixed(2)}`).join(', ')}`,
  );
}

console.log(lines.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} pair(s) under their minimum:\n  ${failures.join('\n  ')}`);
  process.exitCode = 1;
} else {
  console.log('\nEvery token clears its minimum on every ground, in both modes.');
}
