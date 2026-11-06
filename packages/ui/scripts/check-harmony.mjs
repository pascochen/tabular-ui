#!/usr/bin/env node
// Measures how the Riso Ledger ramps work together (harmony), before and after a palette change.
//
//   node packages/ui/scripts/check-harmony.mjs [--before <git ref>]
//
// "Before" is palette.css and theme.css at a git ref (default `main`); "after" is the working tree.
// Prints one Markdown table per criterion, H1–H9. It reports, it does not gate: contrast is
// check-contrast.mjs's job, and a harmony target that fails is a finding to show, not a build error.
//
// Methods, so every number can be traced:
// - Ramp values are the oklch() strings palette.css ships, converted to 8-bit hex as the browser
//   paints them (culori formatHex).
// - A tint (alpha over a ground) is composited in sRGB and rounded to 8 bits per channel, as the
//   browser and axe do, the same function as check-contrast.mjs.
// - "Distance" is Euclidean OKLab distance ×100 between two painted colours.
// - "Deutan" is that distance after Machado (2009) deuteranopia simulation at full severity
//   (culori filterDeficiencyDeuter(1)), docs/design-system.md §1's method.
// - Chroma and hue of a painted colour are OKLCH, read back from the 8-bit result.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { converter, differenceEuclidean, displayable, filterDeficiencyDeuter, formatHex } from 'culori';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const beforeRef = args.includes('--before') ? args[args.indexOf('--before') + 1] : 'main';

const toRgb = converter('rgb');
const toOklch = converter('oklch');
const distance = differenceEuclidean('oklab');
const deutan = filterDeficiencyDeuter(1);

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const CHROMATIC = ['ivy', 'vermilion', 'ochre', 'federal', 'orchid', 'teal'];
// The five role hues, and the ramp each role's colour comes from. Interactive marks share ivy with success.
const ROLES = { danger: 'vermilion', warning: 'ochre', success: 'ivy', info: 'federal', agent: 'orchid' };
const TINT_ALPHA = 0.1;
const GREY_CHROMA = 0.008;

// ---------------------------------------------------------------------------
// Reading a palette: from a git ref, or from the working tree.
// ---------------------------------------------------------------------------
function load(ref) {
  const read = (file) =>
    ref
      ? execFileSync('git', ['show', `${ref}:packages/ui/${file}`], { cwd: root, encoding: 'utf8' })
      : readFileSync(resolve(root, file), 'utf8');
  const ramps = new Map();
  for (const m of read('src/styles/palette.css').matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)) {
    const o = toOklch(m[3]);
    ramps.set(`${m[1]}-${m[2]}`, { oklch: m[3], l: o.l * 100, c: o.c, h: o.h ?? 0, hex: formatHex(m[3]) });
  }
  const theme = read('src/styles/theme.css');
  const block = (selector) => {
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
  };
  const modes = { light: block(':root'), dark: block("[data-theme='dark']") };
  const token = (mode, name) => {
    const value = modes[mode].get(`--tui-${name}`);
    const m = value?.match(/^(?:--alpha\()?var\(--color-([a-z]+-\d+)\)(?: \/ ([\d.]+)%\))?$/);
    if (!m) throw new Error(`${mode} --tui-${name} is "${value}", not a palette reference`);
    return { ref: m[1], hex: ramps.get(m[1]).hex, alpha: m[2] ? Number(m[2]) / 100 : 1 };
  };
  return { ramps, token, step: (name) => ramps.get(name) };
}

// Paint `top` at `alpha` over `bottom`, in sRGB, rounded to 8 bits per channel.
function over(bottom, top, alpha) {
  const b = toRgb(bottom);
  const t = toRgb(top);
  const mix = (x, y) => Math.round((alpha * y + (1 - alpha) * x) * 255) / 255;
  return formatHex({ mode: 'rgb', r: mix(b.r, t.r), g: mix(b.g, t.g), b: mix(b.b, t.b) });
}
const dist = (a, b) => distance(a, b) * 100;
const distDeutan = (a, b) => distance(deutan(toRgb(a)), deutan(toRgb(b))) * 100;
const chromaOf = (hex) => toOklch(hex).c;
const hueOf = (hex) => toOklch(hex).h ?? 0;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const hueGap = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
function maxSrgbChroma(l, h) {
  let lo = 0,
    hi = 0.4;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (displayable({ mode: 'oklch', l: l / 100, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// The criteria.
// ---------------------------------------------------------------------------
function measure(p) {
  const out = {};

  // H1. Shared lightness: every chromatic ramp at the same L, step by step.
  out.h1 = STEPS.map((s) => {
    const ls = CHROMATIC.map((r) => p.step(`${r}-${s}`).l);
    return { step: s, l: ls[0], spread: Math.max(...ls) - Math.min(...ls) };
  });

  // H2. Hue spacing: the five role hues and teal, around the wheel, at step 500.
  const hues = CHROMATIC.map((r) => ({ ramp: r, h: p.step(`${r}-500`).h })).sort((a, b) => a.h - b.h);
  out.h2 = hues.map((x, i) => {
    const next = hues[(i + 1) % hues.length];
    return { from: x.ramp, fromH: x.h, to: next.ramp, toH: next.h, gap: (next.h - x.h + 360) % 360 };
  });
  out.inkHue = p.step('ledger-950').h;
  out.paperHue = p.step('ledger-50').h;

  // H3. Loudness: chroma at 500, and whether sRGB is what holds it there.
  // Also at 400 (dark-mode text) and 700 (light-mode text), the steps each mode reads.
  const loud = (step) =>
    CHROMATIC.map((r) => {
      const s = p.step(`${r}-${step}`);
      const limit = maxSrgbChroma(s.l, s.h) * 0.98;
      return { ramp: r, c: s.c, gamut: s.c >= limit - 0.0015 };
    });
  out.h3 = { 500: loud(500), 400: loud(400), 700: loud(700) };

  // H4, H5, H8. Tints: {hue}-500 at 10%, and at the alpha theme.css ships, over each mode's canvas.
  out.tints = {};
  for (const mode of ['light', 'dark']) {
    const canvas = p.token(mode, 'canvas').hex;
    out.tints[mode] = Object.entries(ROLES).map(([role, ramp]) => {
      const fg = p.step(`${ramp}-500`).hex;
      const shipped = p.token(mode, `bg-${role}`);
      const at = (alpha) => {
        const painted = over(canvas, fg, alpha);
        return { hex: painted, dist: dist(painted, canvas), c: chromaOf(painted), h: hueOf(painted) };
      };
      return {
        role,
        ten: at(TINT_ALPHA),
        shippedAlpha: shipped.alpha,
        shippedRef: shipped.ref,
        shipped: at(shipped.alpha),
        onWhite: hueOf(over('#ffffff', fg, TINT_ALPHA)),
      };
    });
  }

  // H7. The neutral middle.
  out.h7 = [300, 400, 500, 600, 700].map((s) => ({ step: s, c: p.step(`ledger-${s}`).c, h: p.step(`ledger-${s}`).h }));

  // H9. Role pairs, as each mode draws them: text against text, and the primary button against the info badge.
  out.h9 = {};
  for (const mode of ['light', 'dark']) {
    const t = (name) => p.token(mode, name).hex;
    const canvas = t('canvas');
    const infoGround = over(canvas, t('bg-info'), p.token(mode, 'bg-info').alpha);
    const pairs = [
      ['info vs agent, text', t('text-info'), t('text-agent')],
      ['info vs success, text', t('text-info'), t('text-success')],
      ['danger vs warning, text', t('text-danger'), t('text-warning')],
      ['ink vs info: primary fill vs info badge text', t('fill-interactive'), t('text-info')],
      ['ink vs info: primary fill vs info solid fill', t('fill-interactive'), t('fill-info')],
      ['ink vs info: primary fill vs info badge ground', t('fill-interactive'), infoGround],
    ];
    out.h9[mode] = pairs.map(([name, a, b]) => ({ name, typical: dist(a, b), deutan: distDeutan(a, b), a, b }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------
const before = measure(load(beforeRef));
const after = measure(load(null));
const f = (n, d = 1) => n.toFixed(d);
const pct = (n) => `${n >= 0 ? '+' : ''}${Math.round(n * 100)}%`;
const lines = [`# Harmony: \`${beforeRef}\` (before) vs working tree (after)`, ''];
const table = (head, rows) => {
  lines.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
  for (const r of rows) lines.push(`| ${r.join(' | ')} |`);
  lines.push('');
};

// H1
lines.push('## H1 Shared lightness (target: identical)', '');
const h1 = (m) => {
  const worst = Math.max(...m.h1.map((x) => x.spread));
  return worst < 1e-6 ? 'identical at all 11 steps' : `spread up to ${f(worst, 2)} L`;
};
table(['', 'Before', 'After'], [['Six chromatic ramps', h1(before), h1(after)]]);

// H2
lines.push('## H2 Hue spacing (target: no gap under 45°)', '');
const gapRows = (m) => m.h2.map((g) => `${g.from} ${f(g.fromH)}° → ${g.to} ${f(g.toH)}°: ${f(g.gap)}°`);
const [gb, ga] = [gapRows(before), gapRows(after)];
table(
  ['Before', 'After'],
  gb.map((x, i) => [x, ga[i]]),
);
const spread = (m) => {
  const gs = m.h2.map((g) => g.gap);
  const min = Math.min(...gs);
  return `narrowest ${f(min)}°${min < 45 ? ' **under 45°**' : ''}, widest ${f(Math.max(...gs))}°, spread ${f(Math.max(...gs) - min)}°`;
};
table(
  ['', 'Before', 'After'],
  [
    ['Gaps', spread(before), spread(after)],
    [
      'Ledger ink hue (outside the rule)',
      `${f(before.inkHue)}°, ${f(hueGap(before.inkHue, before.h2.find((g) => g.from === 'federal').fromH))}° from info`,
      `${f(after.inkHue)}°, ${f(hueGap(after.inkHue, after.h2.find((g) => g.from === 'federal').fromH))}° from info`,
    ],
  ],
);

// H3
lines.push('## H3 Loudness: chroma at step 500 (flag: more than 20% from the median)', '');
for (const step of [500, 400, 700]) {
  if (step !== 500)
    lines.push(`Step ${step} (${step === 400 ? 'dark-mode text' : 'light-mode text'}), for reference:`, '');
  const mb = median(before.h3[step].map((x) => x.c));
  const ma = median(after.h3[step].map((x) => x.c));
  const cell = (x, med) => {
    const d = x.c / med - 1;
    return `${f(x.c, 3)} (${pct(d)})${Math.abs(d) > 0.2 ? ' **>20%**' : ''}${x.gamut ? ' sRGB-limited' : ''}`;
  };
  table(
    ['Ramp', 'Before', 'After'],
    [
      ...before.h3[step].map((x, i) => [x.ramp, cell(x, mb), cell(after.h3[step][i], ma)]),
      ['median', f(mb, 3), f(ma, 3)],
    ],
  );
}

// H4 / H8 tints
for (const mode of ['light', 'dark']) {
  const ground = mode === 'light' ? 'paper' : 'ink';
  lines.push(
    `## ${mode === 'light' ? 'H4' : 'H8'} Tint strength on ${ground} (${mode}): {hue}-500 over the canvas`,
    '',
    'Distance from the canvas ×100 (deviation from the median of the five; flag beyond ±15%) / tint chroma (flag under 0.008).',
    '',
  );
  for (const which of ['ten', 'shipped']) {
    const cells = (m) => {
      const med = median(m.tints[mode].map((x) => x[which].dist));
      return m.tints[mode].map((x) => {
        const t = x[which];
        const d = t.dist / med - 1;
        return `${f(t.dist, 2)} (${pct(d)})${Math.abs(d) > 0.15 ? ' **±15%**' : ''} / ${f(t.c, 4)}${t.c < GREY_CHROMA ? ' **grey**' : ''}`;
      });
    };
    const [cb, ca] = [cells(before), cells(after)];
    lines.push(which === 'ten' ? 'At 10% (the criterion):' : 'At the alpha theme.css ships:', '');
    table(
      ['Role', ...(which === 'shipped' ? ['Alpha'] : []), 'Before', 'After'],
      before.tints[mode].map((x, i) => [
        x.role,
        ...(which === 'shipped' ? [`${Math.round(after.tints[mode][i].shippedAlpha * 100)}%`] : []),
        cb[i],
        ca[i],
      ]),
    );
  }
}

// H5
lines.push(
  '## H5 Tint hue fidelity: 10% tint on paper vs on white',
  '',
  `Hue on paper / hue on white (difference). "noisy": tint chroma under ${GREY_CHROMA}, where 8-bit rounding moves the hue by about ±10°.`,
  '',
);
const fid = (x) => {
  const d = hueGap(x.ten.h, x.onWhite);
  return `${f(x.ten.h, 0)}° / ${f(x.onWhite, 0)}° (${f(d, 0)}°)${x.ten.c < GREY_CHROMA ? ' noisy' : ''}`;
};
table(
  ['Role', 'Before', 'After'],
  before.tints.light.map((x, i) => [x.role, fid(x), fid(after.tints.light[i])]),
);

// H6
lines.push('## H6 Paper–ink complement (target: within 5°)', '');
const comp = (m) => {
  const opposite = (m.paperHue + 180) % 360;
  return `paper ${f(m.paperHue)}° + 180° = ${f(opposite)}°, ink ${f(m.inkHue)}°: ${f(hueGap(opposite, m.inkHue))}° apart`;
};
table(['', 'Before', 'After'], [['Ledger 50 vs 950', comp(before), comp(after)]]);

// H7
lines.push('## H7 Neutral middle: ledger chroma and hue (target: 500 and 600 at chroma ≤ 0.005)', '');
const mid = (x) => `${f(x.c, 3)} at ${f(x.h)}°${[500, 600].includes(x.step) && x.c > 0.0055 ? ' **over 0.005**' : ''}`;
table(
  ['Step', 'Before', 'After'],
  before.h7.map((x, i) => [x.step, mid(x), mid(after.h7[i])]),
);

// H9
lines.push(
  '## H9 Role pairs: distance ×100, typical vision / deuteranopia',
  '',
  'Text pairs use each mode’s --color-text-* tokens. The ink pairs compare the primary button’s fill with the info badge (its text, its tint over the canvas) and with the solid info fill. "closer" flags a pair whose distance dropped by more than 0.1.',
  '',
);
for (const mode of ['light', 'dark']) {
  lines.push(`${mode === 'light' ? 'Light' : 'Dark'} mode:`, '');
  table(
    ['Pair', 'Before', 'After', ''],
    before.h9[mode].map((x, i) => {
      const y = after.h9[mode][i];
      const closer = [];
      if (y.typical < x.typical - 0.1) closer.push('typical');
      if (y.deutan < x.deutan - 0.1) closer.push('deutan');
      return [
        x.name,
        `${f(x.typical)} / ${f(x.deutan)}`,
        `${f(y.typical)} / ${f(y.deutan)}`,
        closer.length ? `**closer** (${closer.join(', ')})` : '',
      ];
    }),
  );
}

console.log(lines.join('\n'));
